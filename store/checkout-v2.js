import {request,identity} from './commerce-client.js';
import {mountPayment,unmountPayment} from './payment-brick.js';
import {variantMedia} from './variant-media.js';
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API=(typeof window.GELZ_API_BASE==='string'?window.GELZ_API_BASE:'').replace(/\/$/,'');
let options=null,processing=false,checkoutReady=false;
const zipDigits=value=>String(value||'').replace(/\D/g,'').slice(0,8);
const toZip=digits=>digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;
export async function openCheckout(cart,catalog,onClose){
 const byId=new Map(catalog.map(x=>[x.id,x]));
 const subtotal=cart.reduce((s,x)=>s+byId.get(x.id).price*x.qty,0);
 await unmountPayment();try{await identity();}catch{}
 $('#checkoutPage').hidden=false;options=null;checkoutReady=false;processing=false;
 $('#checkoutContents').innerHTML=`<div class="checkout-head"><p class="eyebrow">GELZ STORE / FINALIZAÇÃO</p><h1 id="checkoutTitle">Finalize sua compra<span class="checkout-dot">.</span></h1><div class="checkout-progress"><span>01 · IDENTIFICAÇÃO</span><span>02 · ENTREGA</span><span>03 · PAGAMENTO</span></div></div><div class="checkout-layout">
 <form id="gelzOrderForm">
 <section class="checkout-step"><h2><b>1</b> Seus dados</h2><div class="checkout-fields">
 <label class="full-field">Nome completo<input name="name" autocomplete="name" required maxlength="120"></label>
 <label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="180"></label>
 <label>Telefone com DDD<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required minlength="10" maxlength="20" placeholder="(11) 99999-9999"></label></div></section>
 <section class="checkout-step"><h2><b>2</b> Endereço</h2><div class="checkout-fields">
 <label>CEP<input name="postalCode" inputmode="numeric" autocomplete="postal-code" required placeholder="00000-000" maxlength="9"><small id="cepHint" aria-live="polite">Informe o CEP para buscar o endereço.</small></label>
 <label>UF<input name="state" required maxlength="2" placeholder="SP" autocomplete="address-level1"></label>
 <label class="full-field">Rua ou avenida<input name="street" required maxlength="150" autocomplete="address-line1"></label>
 <label>Número<input name="number" required maxlength="15"></label>
 <label>Complemento<input name="complement" maxlength="100"></label>
 <label>Bairro<input name="district" required maxlength="100" autocomplete="address-level3"></label>
 <label class="full-field">Cidade<input name="city" required maxlength="100" autocomplete="address-level2"></label></div></section>
 <section class="checkout-step"><h2><b>3</b> Frete e pagamento</h2>
 <p class="notice-block" id="checkoutReadiness">Verificando disponibilidade de pagamento e frete. Os dados do cartão são tratados pelo componente seguro do Mercado Pago.</p>
 <div id="shippingStatus" class="shipping-results">Informe o CEP e consulte as opções de entrega.</div>
 <button class="btn btn-outline" id="quoteButton" type="button" disabled>CONSULTAR FRETE ↗</button>
 </section><label>Cupom de desconto<input name="coupon" maxlength="30" placeholder="Opcional"></label><p class="checkout-error" id="checkoutError" role="alert"></p>
 <button id="payButton" class="btn btn-black full" type="submit" disabled>CONTINUAR PARA PAGAMENTO <span>↗</span></button>
 <p class="detail-note">Os dados do cartão são enviados diretamente ao Mercado Pago. Confira juros e parcelamento no componente de pagamento antes de confirmar.</p>
 </form><section id="paymentArea" class="checkout-step" hidden></section>
 <aside class="checkout-resume"><h2>Resumo do pedido</h2>
 ${cart.map(x=>{const p=byId.get(x.id),photo=variantMedia(p,x.color).images[0]||p.image;return `<div class="checkout-line"><img src="${esc(photo)}" alt="${esc(p.name)}" loading="lazy"><div><strong>${esc(p.name)}</strong><small>${esc(x.color)} · ${esc(x.size)} · ${x.qty} un.</small></div><b>${money(p.price*x.qty)}</b></div>`}).join('')}
 <div class="checkout-row"><span>Subtotal</span><b>${money(subtotal)}</b></div><div class="checkout-row"><span>Frete</span><b id="checkoutShipping">A calcular</b></div>
 <div class="checkout-row total"><span>Total</span><b id="checkoutTotal">${money(subtotal)}</b></div><p>Valores de entrega e disponibilidade são confirmados antes do pagamento. Pedidos só são aceitos após validação do estoque.</p></aside></div>`;
 // O botão de pagamento só é liberado quando a API confirmar que a operação está ativa.
 const status=$('#checkoutReadiness');
 if(API){
  try{
   const response=await fetch(API+'/api/health',{cache:'no-store'});
   const health=await response.json();
   checkoutReady=response.ok&&health.paymentsEnabled===true;
  }catch{checkoutReady=false}
 }
 $('#quoteButton').disabled=!checkoutReady;
 $('#payButton').disabled=!checkoutReady;
 status.textContent=checkoutReady
  ?'Pagamento seguro via Mercado Pago. Consulte o frete e confirme os dados para continuar.'
  :'Loja em preparação: pagamentos e fretes indisponíveis até a configuração e validação do estoque e da conta Mercado Pago. Nenhuma cobrança será realizada.';
 const form=$('#gelzOrderForm');
 let lastPostal='';
 form.elements.postalCode.addEventListener('input',e=>{
  const digits=zipDigits(e.target.value);e.target.value=toZip(digits);
  if(options?.zip!==digits){options=null;$('#shippingStatus').textContent='Consulte o frete para o CEP informado.';$('#checkoutShipping').textContent='A calcular';$('#checkoutTotal').textContent=money(subtotal)}
 });
 form.elements.phone.addEventListener('input',e=>{
  const n=e.target.value.replace(/\D/g,'').slice(0,11);
  e.target.value=n.length>6?'('+n.slice(0,2)+') '+n.slice(2,n.length===11?7:6)+'-'+n.slice(n.length===11?7:6):n.length>2?'('+n.slice(0,2)+') '+n.slice(2):n;
 });
 form.elements.postalCode.addEventListener('blur',async()=>{
  const z=zipDigits(form.elements.postalCode.value);
  if(z.length!==8||z===lastPostal)return;
  lastPostal=z;$('#cepHint').textContent='Buscando endereço pelo CEP…';
  try{
   const response=await fetch('https://viacep.com.br/ws/'+z+'/json/',{cache:'no-store'});
   if(!response.ok)throw Error('CEP não localizado');
   const place=await response.json();if(place.erro)throw Error('CEP não localizado');
   if(zipDigits(form.elements.postalCode.value)!==z)return;
   const fill=(name,value)=>{if(value&&!form.elements[name].value.trim())form.elements[name].value=value};
   fill('street',place.logradouro);fill('district',place.bairro);fill('city',place.localidade);fill('state',place.uf);
   $('#cepHint').textContent='Endereço localizado. Confira o número e os demais dados.';
  }catch{$('#cepHint').textContent='Não foi possível preencher automaticamente; informe o endereço manualmente.'}
 });
 $('#quoteButton').addEventListener('click',async()=>{
  const f=$('#gelzOrderForm'),zip=f.elements.postalCode.value.replace(/\D/g,'');
  const el=$('#shippingStatus');options=null;
  if(zip.length!==8){el.textContent='Digite um CEP válido com 8 números.';return}
  if(!checkoutReady){el.textContent='Frete não ativado. Nenhuma cobrança será realizada.';return}
  el.textContent='Consultando...';
  try{
   const result=await fetch(API+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postalCode:zip,items:cart.map(x=>({productId:x.id,color:x.color,size:x.size,quantity:x.qty}))})});
   const data=await result.json();if(!result.ok||!Array.isArray(data.options)||!data.options.length)throw Error(data.error||'Frete não disponível');
   options={zip,list:data.options};el.innerHTML=data.options.map((x,i)=>`<label class="freight-option"><input type="radio" name="freight" value="${esc(x.id)}" ${i===0?'checked':''}><span>${esc(x.name)}<small>${x.days?esc(x.days)+' dias úteis':'Prazo a confirmar'}</small></span><b>${money(x.price)}</b></label>`).join('');
   const updateFreight=()=>{const id=f.querySelector('input[name="freight"]:checked')?.value;const selected=options?.list.find(x=>x.id===id);$('#checkoutShipping').textContent=selected?money(selected.price):'A calcular';$('#checkoutTotal').textContent=money(subtotal+(selected?.price||0))};
   el.addEventListener('change',updateFreight);
   updateFreight();
  }catch(error){el.textContent=error.message}
 });
 $('#gelzOrderForm').addEventListener('submit',async event=>{
  event.preventDefault();const f=event.currentTarget,err=$('#checkoutError');err.textContent='';
  if(!checkoutReady){err.textContent='Pagamento indisponível: a loja ainda está em preparação.';return}
  if(processing)return;const shipping=f.querySelector('input[name="freight"]:checked');
  if(!options||!shipping||options.zip!==f.elements.postalCode.value.replace(/\D/g,'')){err.textContent='É preciso consultar e selecionar o frete.';return}
  const e=f.elements;
  const customer={name:e.name.value.trim(),email:e.email.value.trim(),phone:e.phone.value.trim()};
  const address={postalCode:e.postalCode.value.replace(/\D/g,''),state:e.state.value.trim(),street:e.street.value.trim(),number:e.number.value.trim(),complement:e.complement.value.trim(),district:e.district.value.trim(),city:e.city.value.trim()};
  const payload={customer,address,coupon:e.coupon.value.trim(),shippingOptionId:shipping.value,items:cart.map(x=>({productId:x.id,color:x.color,size:x.size,quantity:x.qty}))};
  processing=true;$('#payButton').disabled=true;
  try{
   const fingerprint=JSON.stringify(payload);let attempt;
   try{attempt=JSON.parse(sessionStorage.getItem('gelz:checkout'));}catch{}
   if(!attempt||attempt.fingerprint!==fingerprint)attempt={fingerprint,key:crypto.randomUUID(),token:crypto.randomUUID()+crypto.randomUUID()};
   sessionStorage.setItem('gelz:checkout',JSON.stringify(attempt));
   const data=await request('/api/checkout',{method:'POST',headers:{'Idempotency-Key':attempt.key},data:{...payload,accessToken:attempt.token}});
   $('#checkoutTotal').textContent=money(data.totalCents/100);$('#checkoutShipping').textContent=money(data.shippingCents/100);
   $('#paymentArea').hidden=false;await mountPayment(data,attempt.token);
   f.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
   $('#paymentArea').scrollIntoView({behavior:'smooth'});
  }catch(error){err.textContent=error.message;processing=false;$('#payButton').disabled=false}
 });
}