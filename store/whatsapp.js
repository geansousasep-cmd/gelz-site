// Atendimento comercial da GELZ Store: este fluxo inicia apenas uma conversa,
// sem criar pedido ou cobrar o cliente no site.
const PHONE = '5511971443233';
const brl = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value).replace(/[\u00a0\u202f]/g,' ');

export function orderWhatsAppUrl(items,catalog){
 const byId=new Map(catalog.map(product=>[product.id,product]));
 const chosen=items.map(item=>({item,product:byId.get(item.id)}))
   .filter(entry=>entry.product&&entry.item.qty>0);
 if(!chosen.length)throw new Error('Selecione um produto para conversar no WhatsApp.');
 const lines=['Olá, GELZ Store! 👋','Gostaria de consultar e comprar as peças abaixo:',''];
 let subtotal=0;
 chosen.forEach(({item,product},index)=>{
  const quantity=Math.max(1,Math.floor(Number(item.qty)||1));
  const price=Number(product.price)||0;
  subtotal+=price*quantity;
  const link='https://gelz.tech/store/product.html?id='+encodeURIComponent(product.id)
   +'&color='+encodeURIComponent(item.color||'');
  lines.push((index+1)+'. *'+product.name+'*',
   'Cor: '+(item.color||'A definir'),
   'Tamanho: '+(item.size||'A definir'),
   'Quantidade: '+quantity,
   'Preço exibido: '+brl(price*quantity),
   'Produto: '+link,'');
 });
 lines.push('Subtotal de referência: '+brl(subtotal),'',
  'Podem confirmar a disponibilidade, o valor final e o frete, por favor?');
 return 'https://wa.me/'+PHONE+'?text='+encodeURIComponent(lines.join('\n'));
}
