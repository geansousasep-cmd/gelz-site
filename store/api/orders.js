import {demand,text,sql,all,sha,cart,address,customer,stock,quote,paymentReady,user} from './core.js';
export async function createOrder(req,env,data){
 demand(paymentReady(env),'Checkout em configuração; cobranças desativadas',503);
 const key=text(req.headers.get('Idempotency-Key'),80),token=text(data.accessToken,128);
 demand(/^[\w-]{20,80}$/.test(key)&&/^[\w-]{32,128}$/.test(token),'Identificador de checkout inválido');
 const u=await user(req,env,false),items=cart(data.items),c=customer(data.customer),a=address(data.address),code=text(data.coupon,30).toUpperCase();
 const fingerprint=await sha(JSON.stringify({items,c,a,code,shipping:text(data.shippingOptionId),user:u?.id||null}));
 const existing=await sql(env,'SELECT * FROM orders WHERE idempotency_key=?',key).first();
 if(existing){demand(existing.access_hash===await sha(token)&&existing.request_hash===fingerprint,'Checkout alterado. Inicie outro pedido.',409);return publicOrder(existing);}
 const loaded=await stock(env,items),options=await quote(env,a.postalCode,loaded),shipping=options.find(x=>x.id===String(data.shippingOptionId));demand(shipping,'Consulte o frete novamente');
 const subtotal=loaded.reduce((sum,x)=>sum+x.price_cents*x.quantity,0);let discount=0;
 if(code){const coupon=await sql(env,'SELECT * FROM coupons WHERE code=? AND active=1 AND (expires_at IS NULL OR expires_at>?)',code,Math.floor(Date.now()/1000)).first();demand(coupon&&subtotal>=coupon.min_cents,'Cupom inválido, expirado ou valor mínimo não atingido');discount=Math.floor(subtotal*coupon.percent/100);}
 const id=crypto.randomUUID(),total=subtotal-discount+Math.round(shipping.price*100),expires=Math.floor(Date.now()/1000)+1800;
 const snapshot=loaded.map(i=>({productId:i.productId,name:i.name,color:i.color,size:i.size,quantity:i.quantity,priceCents:i.price_cents}));
 const statements=[sql(env,"INSERT INTO orders(id,status,items_json,customer_json,address_json,shipping_service_id,shipping_cents,total_cents,created_at,user_id,access_hash,request_hash,idempotency_key,expires_at,discount_cents,coupon_code,shipping_json) VALUES(?,'pending',?,?,?,?,?,?,datetime('now'),?,?,?,?,?,?,?,?)",id,JSON.stringify(snapshot),JSON.stringify(c),JSON.stringify(a),shipping.id,Math.round(shipping.price*100),total,u?.id||null,await sha(token),fingerprint,key,expires,discount,code||null,JSON.stringify(shipping)),...snapshot.map(i=>sql(env,'INSERT INTO order_items(order_id,product_id,color,size,quantity,price_cents) VALUES(?,?,?,?,?,?)',id,i.productId,i.color,i.size,i.quantity,i.priceCents)),sql(env,'INSERT INTO outbox(id,order_id,event) VALUES(?,?,?)',id+':created',id,'created')];
 try{await env.DB.batch(statements);}catch(error){const retry=await sql(env,'SELECT * FROM orders WHERE idempotency_key=?',key).first();if(retry&&retry.access_hash===await sha(token)&&retry.request_hash===fingerprint)return publicOrder(retry);throw error;}
 return publicOrder(await sql(env,'SELECT * FROM orders WHERE id=?',id).first());
}
export function publicOrder(o){return {id:o.id,status:o.status,items:JSON.parse(o.items_json),shipping:JSON.parse(o.shipping_json||'{}'),shippingCents:o.shipping_cents,discountCents:o.discount_cents,totalCents:o.total_cents,createdAt:o.created_at,expiresAt:o.expires_at,fulfillment:o.fulfillment,trackingCode:o.tracking_code,payment:JSON.parse(o.payment_json||'null')};}
export async function ownedOrder(req,env,id){const o=await sql(env,'SELECT * FROM orders WHERE id=?',id).first();demand(o,'Pedido não encontrado',404);const guest=req.headers.get('X-Order-Token');if(guest&&o.access_hash===await sha(guest))return o;const u=await user(req,env);demand(o.user_id===u.id,'Pedido não encontrado',404);return o;}
export async function mp(env,path,method='GET',data,key){const r=await fetch('https://api.mercadopago.com/v1/'+path,{method,headers:{Authorization:'Bearer '+env.MP_ACCESS_TOKEN,'Content-Type':'application/json',...(key?{'X-Idempotency-Key':key}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(18000)});demand(r.ok,'Pagamento em verificação. Consulte o pedido antes de tentar novamente.',502);return r.json();}
export async function reconcile(env,p){
 const o=await sql(env,'SELECT * FROM orders WHERE id=?',text(p.external_reference)).first();if(!o)return;
 demand(p.live_mode===false&&p.currency_id==='BRL'&&Math.round(Number(p.transaction_amount)*100)===o.total_cents,'Pagamento não corresponde ao pedido',409);
 demand(!o.payment_id||String(p.id)===o.payment_id,'Outro pagamento associado ao pedido',409);
 const mapped={approved:'paid',rejected:'rejected',cancelled:'cancelled',refunded:'refunded',charged_back:'chargeback'}[p.status]||'paying';
 // Never revive released stock or downgrade a settled order due to delayed notifications.
 const allowed={pending:['paying','paid','rejected','cancelled'],paying:['paying','paid','rejected','cancelled'],paid:['refunded','chargeback'],refunded:[],chargeback:[],expired:[],rejected:[],cancelled:[]};
 if(!(allowed[o.status]||[]).includes(mapped))return;
 const transaction=p.point_of_interaction?.transaction_data;
 const safe={id:String(p.id),status:p.status,detail:text(p.status_detail),qrCode:transaction?.qr_code||null,qrImage:transaction?.qr_code_base64||null};
 await sql(env,'UPDATE orders SET status=?,payment_id=?,payment_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?',mapped,String(p.id),JSON.stringify(safe),o.id,o.status).run();
}
export async function pay(req,env,id,data){demand(paymentReady(env),'Pagamentos desativados',503);const o=await ownedOrder(req,env,id);if(o.payment_id){await reconcile(env,await mp(env,'payments/'+o.payment_id));return publicOrder(await sql(env,'SELECT * FROM orders WHERE id=?',id).first());}
 demand(['pending','paying'].includes(o.status),'Pedido encerrado',409);demand(o.status==='paying'||o.expires_at>Math.floor(Date.now()/1000),'Reserva expirada',409);
 const f=data.formData||{},method=text(f.payment_method_id,50);demand(/^[a-zA-Z0-9_]+$/.test(method),'Meio de pagamento inválido');demand(method==='pix'||(typeof f.token==='string'&&f.token.length<200),'Token seguro do cartão ausente');
 const installments=Number(f.installments||1);demand(Number.isInteger(installments)&&installments>=1&&installments<=12,'Parcelamento inválido');
 // Store only a hash of the first attempt; never store PAN, CVV, or card token.
 const attempt=await sha(JSON.stringify({method,token:f.token||'',installments,issuer:f.issuer_id||''}));
 await sql(env,"INSERT OR IGNORE INTO audit(order_id,actor,action,detail) SELECT ?, 'checkout','payment_attempt',? WHERE NOT EXISTS(SELECT 1 FROM audit WHERE order_id=? AND action='payment_attempt')",id,attempt,id).run();
 const first=await sql(env,"SELECT detail FROM audit WHERE order_id=? AND action='payment_attempt' ORDER BY id LIMIT 1",id).first();demand(first.detail===attempt,'Pagamento anterior em verificação. Aguarde a atualização do pedido.',409);
 const claimed=await sql(env,"UPDATE orders SET status='paying' WHERE id=? AND status='pending' AND expires_at>?",id,Math.floor(Date.now()/1000)).run();
 if(!claimed.meta.changes){const current=await sql(env,'SELECT status FROM orders WHERE id=?',id).first();demand(current.status==='paying','Reserva encerrada',409);}
 const c=JSON.parse(o.customer_json),payload={transaction_amount:o.total_cents/100,description:'GELZ Store '+id,external_reference:id,payment_method_id:method,notification_url:env.API_ORIGIN.replace(/\/$/,'')+'/api/mp-webhook',payer:{email:c.email},...(method==='pix'?{date_of_expiration:new Date(Date.now()+30*60000).toISOString()}:{token:f.token,installments,...(f.issuer_id?{issuer_id:text(f.issuer_id,30)}:{})})};
 if(f.payer?.identification){const n=String(f.payer.identification.number||'').replace(/\D/g,'');demand(n.length===11||n.length===14,'Documento inválido');payload.payer.identification={type:n.length===11?'CPF':'CNPJ',number:n};}
 const p=await mp(env,'payments','POST',payload,id);await reconcile(env,p);return publicOrder(await sql(env,'SELECT * FROM orders WHERE id=?',id).first());
}
export async function maintenance(env){
 await sql(env,"UPDATE orders SET status='expired' WHERE status='pending' AND expires_at<? AND payment_id IS NULL",Math.floor(Date.now()/1000)).run();
 // Paying orders are held until the provider confirms a terminal outcome. A timeout is NOT a failed payment.
 for(const o of await all(env,"SELECT id,payment_id FROM orders WHERE status='paying' LIMIT 50")){try{if(o.payment_id)await reconcile(env,await mp(env,'payments/'+o.payment_id));else{const found=await mp(env,'payments/search?external_reference='+encodeURIComponent(o.id));for(const p of found.results||[])await reconcile(env,p);}}catch{console.error('payment_reconciliation_failed',o.id);}}
 await sql(env,'DELETE FROM rate_limits WHERE expires_at<?',Math.floor(Date.now()/1000)).run();
 if(env.RESEND_API_KEY&&env.EMAIL_FROM&&env.NOTIFICATIONS_ENABLED==='true')for(const event of await all(env,'SELECT b.*,o.customer_json,o.tracking_code FROM outbox b JOIN orders o ON o.id=b.order_id WHERE sent_at IS NULL AND attempts<10 LIMIT 20')){try{const c=JSON.parse(event.customer_json),labels={created:'Pedido recebido',paid:'Pagamento aprovado',shipped:'Pedido enviado',delivered:'Pedido entregue',cancelled:'Pedido cancelado',refunded:'Pagamento reembolsado'};const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':event.id},body:JSON.stringify({from:env.EMAIL_FROM,to:[c.email],subject:'GELZ Store — '+(labels[event.event]||'Atualização do pedido'),text:`${labels[event.event]||'Pedido atualizado'}\nPedido: ${event.order_id}\n${event.tracking_code?'Rastreio: '+event.tracking_code:''}\nAcompanhe na sua conta: https://gelz.tech/store/account/\nContato: contato@gelz.tech`})});await sql(env,'UPDATE outbox SET attempts=attempts+1,sent_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE sent_at END WHERE id=?',r.ok?1:0,event.id).run();}catch{await sql(env,'UPDATE outbox SET attempts=attempts+1 WHERE id=?',event.id).run();}}
}
