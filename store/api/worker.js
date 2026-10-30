const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const fail=(msg,status=400,headers={})=>json({error:msg},status,headers);
const zip=s=>String(s||'').replace(/\D/g,'');
const cents=n=>Math.round(Number(n)*100);
const clean=s=>String(s||'').trim();
const enabled=env=>env.PAYMENTS_ENABLED==='true';
function cors(req,env){const o=req.headers.get('origin')||'',allowed=[env.STORE_ORIGIN||'https://gelz.tech','https://store.gelz.tech'];return allowed.includes(o)?{'Access-Control-Allow-Origin':o,'Access-Control-Allow-Methods':'POST,OPTIONS,GET','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{'Vary':'Origin'}}
function validCart(items){if(!Array.isArray(items)||items.length<1||items.length>15)throw Error('Carrinho inválido');return items.map(i=>{const productId=clean(i.productId),color=clean(i.color),size=clean(i.size),quantity=Number(i.quantity);if(!/^\d{15,25}$/.test(productId)||!color||!size||!Number.isInteger(quantity)||quantity<1||quantity>10)throw Error('Item inválido');return{productId,color,size,quantity}})}
async function loadStock(env,items){const result=[];if(!env.DB)throw Error('Banco de dados não configurado');for(const i of items){const p=await env.DB.prepare('SELECT p.name,p.price_cents,p.weight_g,p.length_cm,p.width_cm,p.height_cm,v.stock,v.reserved FROM products p JOIN variants v ON v.product_id=p.id WHERE p.id=? AND v.color=? AND v.size=? AND p.active=1 AND v.active=1').bind(i.productId,i.color,i.size).first();if(!p||p.stock-p.reserved<i.quantity)throw Error('Sem estoque disponível para '+i.color+'/'+i.size);if(['price_cents','weight_g','length_cm','width_cm','height_cm'].some(k=>!(Number(p[k])>0)))throw Error('Produto sem preço ou medidas de envio');result.push({...i,...p})}return result}
async function freight(env,postal,items){if(zip(postal).length!==8||zip(env.ORIGIN_CEP).length!==8||!env.MELHOR_ENVIO_TOKEN)throw Error('CEP ou transportadora não configurados');const products=items.map((i,n)=>({id:String(n+1),width:Number(i.width_cm),height:Number(i.height_cm),length:Number(i.length_cm),weight:Number(i.weight_g)/1000,insurance_value:i.price_cents/100,quantity:i.quantity}));const endpoint=(env.ME_SANDBOX==='true'?'https://sandbox.melhorenvio.com.br':'https://melhorenvio.com.br')+'/api/v2/me/shipment/calculate';const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+env.MELHOR_ENVIO_TOKEN,'Content-Type':'application/json',Accept:'application/json','User-Agent':'GelzStore (contato@gelz.tech)'},body:JSON.stringify({from:{postal_code:zip(env.ORIGIN_CEP)},to:{postal_code:zip(postal)},products})});if(!r.ok)throw Error('Falha ao consultar a transportadora');const data=await r.json();if(!Array.isArray(data))throw Error('Resposta inválida de frete');return data.filter(x=>x.id&&!x.error&&Number(x.custom_price??x.price)>0).map(x=>({id:String(x.id),name:clean(x.name),price:Number(x.custom_price??x.price),days:Number(x.custom_delivery_time??x.delivery_time)||null}))}
async function signed(req,secret,id){const sign=req.headers.get('x-signature')||'',requestId=req.headers.get('x-request-id')||'',ts=(sign.match(/(?:^|,)ts=([^,]+)/)||[])[1],hash=(sign.match(/(?:^|,)v1=([a-f0-9]+)/)||[])[1];if(!secret||!requestId||!ts||!hash)throw Error('Webhook sem assinatura');const manifest='id:'+id+';request-id:'+requestId+';ts:'+ts+';';const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const expected=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(manifest)))).map(x=>x.toString(16).padStart(2,'0')).join('');if(expected.length!==hash.length)throw Error('Assinatura inválida');let diff=0;for(let i=0;i<hash.length;i++)diff|=expected.charCodeAt(i)^hash.charCodeAt(i);if(diff)throw Error('Assinatura inválida')}
async function paymentWebhook(req,env,url){
 const payload=await req.json();if(payload.type!=='payment')return json({ok:true});const id=clean(url.searchParams.get('data.id')||payload.data?.id);if(!/^\d{4,30}$/.test(id))throw Error('ID de pagamento inválido');await signed(req,env.MP_WEBHOOK_SECRET,id);
 const r=await fetch('https://api.mercadopago.com/v1/payments/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+env.MP_ACCESS_TOKEN}});if(!r.ok)throw Error('Falha ao validar pagamento');const payment=await r.json();const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(clean(payment.external_reference)).first();if(!order)return json({ok:true});if(cents(payment.transaction_amount)!==order.total_cents)throw Error('Valor do pedido não confere');if(payment.status==='approved'&&order.status==='pending'){const items=JSON.parse(order.items_json);const statements=items.map(i=>env.DB.prepare('UPDATE variants SET stock=stock-?,reserved=reserved-? WHERE product_id=? AND color=? AND size=? AND reserved>=? AND stock>=?').bind(i.quantity,i.quantity,i.productId,i.color,i.size,i.quantity,i.quantity));statements.push(env.DB.prepare("UPDATE orders SET status='paid',payment_id=? WHERE id=? AND status='pending'").bind(id,order.id));const results=await env.DB.batch(statements);if(results.some(i=>i.meta?.changes!==1))throw Error('Conflito no estoque: verificar pedido manualmente')}return json({ok:true});
}
async function createCheckout(env,data,loaded,options){
 if(!data.customer||!data.address)throw Error('Dados incompletos');const c=data.customer,a=data.address;
 if(!clean(c.name)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(c.email))||!clean(c.phone))throw Error('Dados do cliente inválidos');
 if(!clean(a.street)||!clean(a.city)||!clean(a.number)||!/^[A-Za-z]{2}$/.test(clean(a.state)))throw Error('Endereço inválido');
 const ship=options.find(x=>x.id===clean(data.shippingOptionId));if(!ship)throw Error('Frete inválido; calcule novamente');
 const total=loaded.reduce((s,i)=>s+i.price_cents*i.quantity,0)+cents(ship.price);
 const id=crypto.randomUUID();const items=loaded.map(i=>({productId:i.productId,color:i.color,size:i.size,quantity:i.quantity,priceCents:i.price_cents}));
 const orderSql=env.DB.prepare("INSERT INTO orders (id,status,items_json,customer_json,address_json,shipping_service_id,shipping_cents,total_cents,created_at) VALUES(?,'pending',?,?,?,?,?,?,datetime('now'))").bind(id,JSON.stringify(items),JSON.stringify(c),JSON.stringify(a),ship.id,cents(ship.price),total);
 const reserve=loaded.map(i=>env.DB.prepare('UPDATE variants SET reserved=reserved+? WHERE product_id=? AND color=? AND size=? AND active=1 AND stock-reserved>=?').bind(i.quantity,i.productId,i.color,i.size,i.quantity));
 const batch=await env.DB.batch([...reserve,orderSql]);if(batch.some(x=>x.meta?.changes!==1))throw Error('Conflito de estoque. Verifique o pedido');
 const url=(env.STORE_ORIGIN||'https://gelz.tech').replace(/\/$/,'')+'/store/';
 const preference={items:[...loaded.map(i=>({id:i.productId,title:i.name+' / '+i.color+' / '+i.size,quantity:i.quantity,unit_price:i.price_cents/100,currency_id:'BRL'})),{id:'shipping',title:'Frete — '+ship.name,quantity:1,unit_price:ship.price,currency_id:'BRL'}],external_reference:id,payer:{email:clean(c.email)},notification_url:(env.API_ORIGIN||'').replace(/\/$/,'')+'/api/mp-webhook',back_urls:{success:url+'?payment=success&order='+id,failure:url+'?payment=failure&order='+id,pending:url+'?payment=pending&order='+id},auto_return:'approved'};
 const mp=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:'Bearer '+env.MP_ACCESS_TOKEN,'Content-Type':'application/json','X-Idempotency-Key':id},body:JSON.stringify(preference)});
 const result=await mp.json();if(!mp.ok||!result.init_point)throw Error('Falha ao criar pagamento. Reserva precisa ser liberada.');
 await env.DB.prepare('UPDATE orders SET preference_id=? WHERE id=?').bind(result.id,id).run();
 return{orderId:id,checkoutUrl:env.MP_SANDBOX==='true'&&result.sandbox_init_point?result.sandbox_init_point:result.init_point};
}
export default {async fetch(req,env){
 const headers=cors(req,env),url=new URL(req.url);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method==='GET'&&url.pathname==='/api/health')return json({status:'ok',paymentsEnabled:enabled(env)},200,headers);
 try{
  if(req.method==='POST'&&url.pathname==='/api/mp-webhook')return await paymentWebhook(req,env,url);
  if(!['/api/quote','/api/checkout'].includes(url.pathname))return fail('Rota não encontrada',404,headers);
  if(req.method!=='POST')return fail('Método não aceito',405,headers);
  const origin=req.headers.get('origin');if(!origin||!headers['Access-Control-Allow-Origin'])return fail('Origem não permitida',403,headers);
  if(!enabled(env))return fail('Loja em configuração — pagamentos inativos',503,headers);
  const data=await req.json(),items=validCart(data.items),loaded=await loadStock(env,items),postal=url.pathname==='/api/quote'?data.postalCode:data.address?.postalCode;
  const options=await freight(env,postal,loaded);
  if(url.pathname==='/api/quote')return json({options},200,headers);
  if(!env.MP_ACCESS_TOKEN||!env.API_ORIGIN)throw Error('Mercado Pago não configurado');
  return json(await createCheckout(env,data,loaded,options),200,headers);
 }catch(e){return fail(e.message||'Erro ao processar',400,headers)}
}};