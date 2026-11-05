import {demand,text,sql} from './core.js';
// Shipment creation/charge is deliberately not automated before fiscal/sender validation.
// Existing sandbox labels can be linked, generated, printed privately and reconciled.
export async function shipment(env,u,o,data){
 demand(o.status==='paid','Envio exige pedido pago',409);
 if(!data.operation){await sql(env,'INSERT INTO shipments(order_id,status,data_json) VALUES(?,?,?) ON CONFLICT(order_id) DO NOTHING',o.id,'prepared',JSON.stringify({service:o.shipping_service_id,recipient:JSON.parse(o.customer_json),address:JSON.parse(o.address_json),items:JSON.parse(o.items_json),invoiceStatus:'not_configured'})).run();return {prepared:true,message:'Dados preparados. A contratação da etiqueta exige validação fiscal, volumes e remetente.'};}
 demand(env.ME_SANDBOX==='true'&&env.MELHOR_ENVIO_TOKEN,'Etiquetas disponíveis somente no ambiente de testes configurado',503);
 const existing=await sql(env,'SELECT * FROM shipments WHERE order_id=?',o.id).first();demand(existing,'Prepare o envio primeiro',409);
 if(data.operation==='link'){const id=text(data.providerId,80);demand(/^[a-zA-Z0-9-]{8,80}$/.test(id),'ID de etiqueta inválido');demand(!existing.provider_id||existing.provider_id===id,'Pedido já vinculado a outra etiqueta',409);await env.DB.batch([sql(env,'UPDATE shipments SET provider_id=? WHERE order_id=? AND (provider_id IS NULL OR provider_id=?)',id,o.id,id),sql(env,'INSERT INTO audit(order_id,actor,action,detail) VALUES(?,?,?,?)',o.id,u.id,'shipment_linked',id)]);return {ok:true};}
 demand(existing.provider_id,'Vincule a etiqueta de teste criada no Melhor Envio',409);
 const action={generate:'generate',print:'print',tracking:'tracking'}[data.operation];demand(action,'Operação de envio inválida');
 const r=await fetch('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/'+action,{method:'POST',headers:{Authorization:'Bearer '+env.MELHOR_ENVIO_TOKEN,'Content-Type':'application/json',Accept:'application/json','User-Agent':'GELZ Store (contato@gelz.tech)'},body:JSON.stringify({orders:[existing.provider_id],...(action==='print'?{mode:'private'}:{})}),signal:AbortSignal.timeout(15000)});demand(r.ok,'Melhor Envio não concluiu a operação; consulte o painel antes de repetir',502);const result=await r.json();
 await sql(env,'INSERT INTO audit(order_id,actor,action,detail) VALUES(?,?,?,?)',o.id,u.id,'shipment_'+action,existing.provider_id).run();
 if(action==='tracking'){const entry=result[existing.provider_id]||result;const tracking=text(entry.tracking||entry.tracking_code,80);await sql(env,'UPDATE shipments SET status=?,data_json=? WHERE order_id=?',text(entry.status)||existing.status,JSON.stringify({...JSON.parse(existing.data_json),tracking:entry}),o.id).run();if(tracking)await sql(env,'UPDATE orders SET tracking_code=? WHERE id=?',tracking,o.id).run();return {ok:true,message:'Status consultado: '+text(entry.status||'sem alteração')};}
 if(action==='print'){demand(typeof result.url==='string'&&/^https:\/\//.test(result.url),'Link de etiqueta indisponível',502);return {url:result.url};}
 return {ok:true,message:'Solicitação de geração enviada ao Melhor Envio. Consulte o status antes de imprimir.'};
}
