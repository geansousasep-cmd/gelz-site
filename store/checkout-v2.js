const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API=(typeof window.GELZ_API_BASE==='string'?window.GELZ_API_BASE:'').replace(/\/$/,'');
let options=null,processing=false;
export function openCheckout(cart,catalog,onClose){
 const byId=new Map(catalog.map(x=>[x.id,x]));
 const subtotal=cart.reduce((s,x)=>s+byId.get(x.id).price*x.qty,0);
 $('#checkoutPage').hidden=false;options=null;
 $('#checkoutContents').innerHTML=`<div class="checkout-head"><p class="eyebrow">FINALIZE SEU PEDIDO</p><h1 id="checkoutTitle">Checkout Gelz Store.</h1></div><div class="checkout-layout">
 <form id="gelzOrderForm">
 <section class="checkout-step"><h2><b>1</b> Seus dados</h2><div class="checkout-fields">
 <label class="full-field">Nome completo<input name="name" autocomplete="name" required maxlength="120"></label>
 <label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="180"></label>
 <label>Telefone<input name="phone" type="tel" autocomplete="tel" required minlength="10" maxlength="20"></label></div></section>
 <section class="checkout-step"><h2><b>2</b> Endereço</h2><div class="checkout-fields">
 <label>CEP<input name="postalCode" inputmode="numeric" autocomplete="postal-code" required placeholder="00000-000" maxlength="9"></label>
 <label>UF<input name="state" required maxlength="2" placeholder="SP"></label>
 <label class="full-field">Endereço<input name="street" required maxlength="150" autocomplete="address-line1"></label>
 <label>Número<input name="number" required maxlength="15"></label>
 <label>Complemento<input name="complement" maxlength="100"></label>
 <label>Bairro<input name="district" required maxlength="100"></label>
 <label class="full-field">Cidade<input name="city" required maxlength="100"></label></div></section>
 <section class="checkout-step"><h2><b>3</b> Frete e pagamento</h2>
 <p class="notice-block">Na versão de testes, pagamentos são bloqueados até confirmar o estoque de cada tamanho e conectar a conta Mercado Pago. Não inserimos dados de cartão neste site.</p>
 <div id="shippingStatus" class="shipping-results">${API?'Informe um CEP para consultar o frete.':'A integração de pagamentos e fretes ainda não foi ativada.'}</div>
 <button class="btn btn-outline" id="quoteButton" type="button">CONSULTAR FRETE ↗</button>
 </section><p class="checkout-error" id="checkoutError" role="alert"></p>
 <button id="payButton" class="btn btn-black full" type="submit" ${API?'':'disabled'}>IR PARA PAGAMENTO <span>↗</span></button>
 <p class="detail-note">O pagamento será feito em ambiente seguro do Mercado Pago. Nenhum pagamento é recebido nesta prévia.</p>
 </form>
 <aside class="checkout-resume"><h2>Seu pedido</h2>
 ${cart.map(x=>{const p=byId.get(x.id);return `<div class="checkout-row"><span>${esc(p.name)} (${esc(x.color)} / ${esc(x.size)}) × ${x.qty}</span><b>${money(p.price*x.qty)}</b></div>`}).join('')}
 <div class="checkout-row total"><span>Subtotal</span><b>${money(subtotal)}</b></div><p>Frete calculado por CEP. Consulte antes de prosseguir.</p></aside></div>`;
 $('#quoteButton').addEventListener('click',async()=>{
  const f=$('#gelzOrderForm'),zip=f.elements.postalCode.value.replace(/\D/g,'');
  const el=$('#shippingStatus');options=null;
  if(zip.length!==8){el.textContent='Digite um CEP válido com 8 números.';return}
  if(!API){el.textContent='A integração logística ainda não está ativa. Não haverá cobrança.';return}
  el.textContent='Consultando...';
  try{
   const result=await fetch(API+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postalCode:zip,items:cart.map(x=>({productId:x.id,color:x.color,size:x.size,quantity:x.qty}))})});
   const data=await result.json();if(!result.ok||!Array.isArray(data.options)||!data.options.length)throw Error(data.error||'Frete não disponível');
   options={zip,list:data.options};el.innerHTML=data.options.map((x,i)=>`<label style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #ddd"><input type="radio" name="freight" value="${esc(x.id)}" ${i===0?'checked':''}><span>${esc(x.name)} • ${esc(x.days||'')} dias úteis</span><b style="margin-left:auto">${money(x.price)}</b></label>`).join('');
  }catch(error){el.textContent=error.message}
 });
 $('#gelzOrderForm').addEventListener('submit',async event=>{
  event.preventDefault();const f=event.currentTarget,err=$('#checkoutError');err.textContent='';
  if(!API){err.textContent='Checkout não configurado.';return}
  if(processing)return;const shipping=f.querySelector('input[name="freight"]:checked');
  if(!options||!shipping||options.zip!==f.elements.postalCode.value.replace(/\D/g,'')){err.textContent='É preciso consultar e selecionar o frete.';return}
  const e=f.elements;
  const customer={name:e.name.value.trim(),email:e.email.value.trim(),phone:e.phone.value.trim()};
  const address={postalCode:e.postalCode.value.replace(/\D/g,''),state:e.state.value.trim(),street:e.street.value.trim(),number:e.number.value.trim(),complement:e.complement.value.trim(),district:e.district.value.trim(),city:e.city.value.trim()};
  const payload={customer,address,shippingOptionId:shipping.value,items:cart.map(x=>({productId:x.id,color:x.color,size:x.size,quantity:x.qty}))};
  processing=true;$('#payButton').disabled=true;
  try{const result=await fetch(API+'/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await result.json();if(!result.ok)throw Error(data.error||'Erro ao gerar pagamento');
   if(typeof data.checkoutUrl!=='string'||!/^https:\/\/(www\.)?(mercadopago\.com|mercadopago\.com\.br|mercadopago\.com\.ar|mercadopago\.com\.mx)\//.test(data.checkoutUrl))throw Error('URL de checkout inválida');
   location.assign(data.checkoutUrl);
  }catch(error){err.textContent=error.message;processing=false;$('#payButton').disabled=false}
 });
}