import {HttpError,demand,sql,all,body,cart,stock,quote,user,admin,rate,signature,paymentReady} from './core.js';
import {createOrder,ownedOrder,publicOrder,pay,mp,reconcile,maintenance} from './orders.js';
import {account,manage,products} from './management.js';
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function route(req,env,url){const p=url.pathname,m=req.method;
 if(m==='GET'&&p==='/api/health')return {status:'ok',paymentsEnabled:paymentReady(env),mode:'test',shippingReady:!!env.MELHOR_ENVIO_TOKEN&&!!env.ORIGIN_CEP,authReady:!!env.SUPABASE_URL&&!!env.SUPABASE_ANON_KEY};
 if(m==='GET'&&p==='/api/config')return {supabaseUrl:env.SUPABASE_URL||'',supabaseAnonKey:env.SUPABASE_ANON_KEY||'',mpPublicKey:env.MP_PUBLIC_KEY||'',mode:'test',paymentsEnabled:paymentReady(env)};
 demand(env.DB,'Banco de dados não configurado',503);
 if(m==='POST'&&p==='/api/mp-webhook'){const data=await body(req);const id=url.searchParams.get('data.id');demand(/^\d{1,30}$/.test(id||''),'ID do webhook ausente');await signature(req,env.MP_WEBHOOK_SECRET,id);if(data.type&&data.type!=='payment')return {ok:true};if(data.data?.id)demand(String(data.data.id)===id,'Webhook inconsistente');await reconcile(env,await mp(env,'payments/'+id));return {ok:true};}
 await rate(req,env);
 if(m==='GET'&&p==='/api/catalog')return {products:await products(env,true)};
 if(m==='POST'&&p==='/api/admin/images'){await admin(req,env);demand(env.IMAGES,'Armazenamento de imagens não configurado',503);const type=req.headers.get('Content-Type');demand(['image/png','image/jpeg','image/webp'].includes(type),'Formato de imagem não permitido');const reader=req.body.getReader(),parts=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>5*1024*1024){await reader.cancel();throw new HttpError('Imagem maior que 5 MB',413);}parts.push(value);}const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}const valid=type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';demand(valid,'Arquivo de imagem inválido');const key=crypto.randomUUID();await env.IMAGES.put(key,bytes,{httpMetadata:{contentType:type}});return {url:env.API_ORIGIN+'/api/images/'+key};}
 if(p.startsWith('/api/admin/')){const u=await admin(req,env);return manage(env,u,m,p,m==='GET'?{}:await body(req));}
 if(p.startsWith('/api/account')){const u=await user(req,env);return account(env,u,m,p,m==='GET'?{}:await body(req));}
 if(m==='POST'&&p==='/api/quote'){const data=await body(req);return {options:await quote(env,data.postalCode,await stock(env,cart(data.items)))};}
 if(m==='POST'&&p==='/api/checkout')return createOrder(req,env,await body(req));
 const order=p.match(/^\/api\/orders\/([\w-]+)(?:\/(payment))?$/);if(order){if(m==='GET')return publicOrder(await ownedOrder(req,env,order[1]));if(m==='POST'&&order[2])return pay(req,env,order[1],await body(req));}
 throw new HttpError('Rota não encontrada',404);
}
export default {
 async fetch(req,env){const url=new URL(req.url),origin=req.headers.get('Origin'),allowed=origin===(env.STORE_ORIGIN||'https://gelz.tech');const headers={'Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,Idempotency-Key,X-Order-Token'}:{})};
 if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
 try{if(req.method==='GET'&&/^\/api\/images\/[\w-]+$/.test(url.pathname)){demand(env.IMAGES,'Imagens indisponíveis',503);const object=await env.IMAGES.get(url.pathname.split('/').pop());demand(object,'Imagem não encontrada',404);return new Response(object.body,{headers:{'Content-Type':object.httpMetadata.contentType,'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff',...headers}});}if(req.method!=='GET'&&url.pathname!=='/api/mp-webhook')demand(allowed,'Origem não permitida',403);demand(['GET','POST'].includes(req.method),'Método não permitido',405);return json(await route(req,env,url),200,headers);}catch(e){const id=crypto.randomUUID();if(!(e instanceof HttpError))console.error('commerce_error',{id,path:url.pathname,type:e.name});const stockError=String(e.message).includes('inventory_');return json({error:e instanceof HttpError?e.message:stockError?'Estoque alterado. Atualize o carrinho.':'Não foi possível concluir. Tente novamente ou contate a loja.',requestId:id},e.status||(stockError?409:500),headers);}
 },async scheduled(_event,env,ctx){ctx.waitUntil(maintenance(env));}
};
