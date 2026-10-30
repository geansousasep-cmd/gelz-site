import {catalog} from './catalog-v2.js';
import {openCheckout} from './checkout-v2.js';
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const get=id=>catalog.find(p=>p.id===id);
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return []}};
const state={cat:'Todas',search:'',sort:'featured',colors:{},favs:new Set(read('gelz:favs')),cart:read('gelz:cart').filter(x=>get(x.id)),active:null,size:null,photo:0};
let lastFocus,toastTimer;
const picked=p=>p.colors.find(c=>c.name===state.colors[p.id])||p.colors[0];
const pics=p=>[...new Set([picked(p)?.image,...p.images].filter(Boolean))];
const swatch=(p,c,detail)=>`<button data-action="${detail?'selectColor':'cardColor'}" data-id="${p.id}" data-color="${esc(c.name)}" class="${picked(p).name===c.name?'selected':''}" style="--swatch:${c.hex}" aria-label="${esc(c.name)}" title="${esc(c.name)}" aria-pressed="${picked(p).name===c.name}"></button>`;
function save(){try{localStorage.setItem('gelz:favs',JSON.stringify([...state.favs]));localStorage.setItem('gelz:cart',JSON.stringify(state.cart))}catch{}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800)}
function badge(){const n=state.cart.reduce((s,x)=>s+x.qty,0);$('#cartBadge').hidden=n===0;$('#cartBadge').textContent=n;$('#cartQty').textContent=n}
function lock(){const active=!$('#cartDrawer').hidden||!$('#productOverlay').hidden||!$('#checkoutPage').hidden;document.body.classList.toggle('is-locked',active);$('#scrim').hidden=!active||!$('#checkoutPage').hidden}
function closeAll(){$('#cartDrawer').hidden=$('#productOverlay').hidden=$('#checkoutPage').hidden=true;lock();lastFocus?.focus?.()}
function filtered(){let result=catalog.filter(p=>(state.cat==='Todas'||p.category===state.cat)&&(!state.search||`${p.name} ${p.category}`.toLowerCase().includes(state.search.toLowerCase())));if(state.sort==='low')result.sort((a,b)=>a.price-b.price);if(state.sort==='high')result.sort((a,b)=>b.price-a.price);if(state.sort==='az')result.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));return result}
function render(){
 $('#categoryTabs').innerHTML=['Todas','Feminino','Masculino','Infantil'].map(c=>`<button class="${c===state.cat?'active':''}" data-action="category" data-category="${c}" aria-pressed="${c===state.cat}">${c}</button>`).join('');
 const items=filtered();$('#resultCount').textContent=`${items.length} PEÇAS NA COLEÇÃO`;
 const card=p=>`<article class="product-card">
 <div class="card-image"><img src="${esc(picked(p)?.image||p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='../gelz-logo.webp'">
 <button class="card-click" data-action="detail" data-id="${p.id}" aria-label="Ver ${esc(p.name)}"></button>
 <span class="card-label">GELZ EDITION</span>
 <button class="card-favorite ${state.favs.has(p.id)?'saved':''}" data-action="favorite" data-id="${p.id}" aria-label="Salvar favorito">${state.favs.has(p.id)?'♥':'♡'}</button></div>
 <div class="card-info"><div class="card-caption"><span>${p.category}</span><span>GELZ STORE</span></div>
 <h3 data-action="detail" data-id="${p.id}">${esc(p.name)}</h3><div class="card-price">${money(p.price)}</div>
 <div class="card-colors" role="group" aria-label="Cores disponíveis">${p.colors.slice(0,8).map(c=>swatch(p,c,false)).join('')}${p.colors.length>8?`<span>+${p.colors.length-8}</span>`:''}</div>
 </div></article>`;
 const groups=state.cat==='Todas'?['Feminino','Masculino','Infantil']:[state.cat];
 const labels={Feminino:['01 / FEMININO','Ela tem presença.','Peças femininas com personalidade.'],Masculino:['02 / MASCULINO','Estilo em movimento.','Essenciais masculinos para todos os dias.'],Infantil:['03 / INFANTIL','Pequenos, com atitude.','Conforto e estilo para a rotina deles.']};
 $('#productGrid').innerHTML=groups.map(c=>{
 const products=items.filter(p=>p.category===c);if(!products.length)return '';
 const title=labels[c]||['GELZ','Toda a coleção',''];
 return `<section class="collection-cluster" id="${c.toLowerCase()}"><header class="cluster-title">
 <div><p class="eyebrow">${title[0]}</p><h3>${title[1]}</h3></div><p>${title[2]}</p></header>${products.map(card).join('')}</section>`
 }).join('')||'<div class="empty-state">Nenhuma peça encontrada. Experimente outro filtro.</div>';
 badge();
}
function product(id){state.active=id;state.size=null;state.photo=0;lastFocus=document.activeElement;$('#cartDrawer').hidden=$('#checkoutPage').hidden=true;$('#productOverlay').hidden=false;renderProduct();lock()}
function renderProduct(){
 const p=get(state.active);if(!p)return;const c=picked(p),gallery=pics(p),main=gallery[Math.min(state.photo,gallery.length-1)]||p.image;
 $('#productContents').innerHTML=`<div class="detail-layout"><div class="detail-visual"><img class="detail-image" src="${esc(main)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='../gelz-logo.webp'"><div class="thumbs">${gallery.slice(0,9).map((img,i)=>`<button data-action="photo" data-index="${i}" class="${state.photo===i?'active':''}" aria-label="Foto ${i+1}"><img src="${esc(img)}" alt="" loading="lazy"></button>`).join('')}</div></div><div class="detail-info">
 <p class="eyebrow">${p.category} / GELZ STORE</p><h2 id="detailTitle">${esc(p.name)}</h2><div class="price">${money(p.price)}</div>
 <div class="variation-label">Cor: <span>${esc(c.name)}</span></div><div class="detail-colors">${p.colors.map(co=>swatch(p,co,true)).join('')}</div>
 <div class="variation-label">Selecione o tamanho <span>${state.size?'· '+esc(state.size):''}</span></div><div class="detail-sizes">${c.sizes.map(sz=>`<button data-action="size" data-size="${esc(sz)}" class="${state.size===sz?'selected':''}" aria-pressed="${state.size===sz}">${esc(sz)}</button>`).join('')}</div>
 <p id="detailError" class="detail-error"></p><button data-action="add" class="btn btn-black buy-button">ADICIONAR À SACOLA <span>↗</span></button><p class="disable-callout">Prévia: pagamento só será liberado após conferir estoque por SKU e ativar a integração segura.</p>
 <div class="specs"><p>${c.image?'Foto desta cor identificada no acervo Gelz.':'O arquivo TikTok não identifica as fotos por cor. Estas fotos são do modelo, não da variante selecionada.'}</p><p>Variações e preços importados dos anúncios.</p></div>
 </div></div>`;
}
function add(){const p=get(state.active);if(!state.size){$('#detailError').textContent='Escolha um tamanho para continuar.';return}const color=picked(p).name,key=p.id+'|'+color+'|'+state.size;let x=state.cart.find(x=>x.key===key);if(x)x.qty=Math.min(10,x.qty+1);else state.cart.push({key,id:p.id,color,size:state.size,qty:1});save();toast('Produto adicionado à sacola');cart()}
function cart(){lastFocus=document.activeElement;$('#productOverlay').hidden=$('#checkoutPage').hidden=true;$('#cartDrawer').hidden=false;renderCart();lock()}
function renderCart(){
 const total=state.cart.reduce((s,x)=>s+get(x.id).price*x.qty,0);$('#cartSubtotal').textContent=money(total);
 $('#cartContents').innerHTML=state.cart.length?state.cart.map(x=>{const p=get(x.id),color=p.colors.find(c=>c.name===x.color);return `<div class="cart-item"><img src="${esc(color?.image||p.image)}" alt="${esc(p.name)}"><div class="cart-item-info"><h3>${esc(p.name)}</h3><small>${esc(x.color)} / ${esc(x.size)}</small><div class="cart-item-bottom"><div class="quantity"><button data-action="dec" data-key="${esc(x.key)}">−</button><span>${x.qty}</span><button data-action="inc" data-key="${esc(x.key)}">+</button></div><b class="cart-item-price">${money(p.price*x.qty)}</b></div><button data-action="remove" data-key="${esc(x.key)}" style="background:none;border:0;padding:12px 0;text-decoration:underline;font-size:11px">Remover</button></div></div>`}).join(''):'<div class="empty-cart">Sua sacola está vazia.<br>Descubra sua próxima peça na coleção.</div>';
 $('#checkoutButton').disabled=state.cart.length===0;badge();
}
function adjust(key,qty){const x=state.cart.find(x=>x.key===key);if(!x)return;x.qty=Math.max(0,Math.min(10,x.qty+qty));state.cart=state.cart.filter(x=>x.qty>0);save();renderCart()}
function search() {closeAll();$('#searchPanel').hidden=false;$('#colecao').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchTerm').focus(),200)}
function menu(){$('#mobileMenu').hidden=!$('#mobileMenu').hidden;document.body.classList.toggle('is-locked',!$('#mobileMenu').hidden)}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==='menu')menu();
 if(a==='category'){state.cat=b.dataset.category;render()}
 if(a==='search')search();
 if(a==='detail')window.location.assign('./product.html?id='+encodeURIComponent(id)+'&color='+encodeURIComponent(state.colors[id]||get(id).colors[0].name));
 if(a==='cardColor'){
  const p=get(id);state.colors[id]=b.dataset.color;
  const card=b.closest('.product-card');
  if(card){
   card.querySelectorAll('.card-colors button').forEach(node=>{
    const selected=node.dataset.color===b.dataset.color;
    node.classList.toggle('selected',selected);
    node.setAttribute('aria-pressed',String(selected));
   });
   const img=card.querySelector('.card-image img');
   const target=picked(p)?.image||p.image;
   if(img&&img.getAttribute('src')!==target){
    img.classList.remove('photo-changing');
    void img.offsetWidth;
    img.src=target;
    img.classList.add('photo-changing');
   }
  }
 }
 if(a==='selectColor'){state.colors[id]=b.dataset.color;state.size=null;state.photo=0;renderProduct()}
 if(a==='photo'){state.photo=+b.dataset.index;renderProduct()}
 if(a==='size'){state.size=b.dataset.size;renderProduct()}
 if(a==='favorite'){state.favs.has(id)?state.favs.delete(id):state.favs.add(id);save();render();toast('Favoritos atualizados')}
 if(a==='favorites'){state.cat='Todas';render();$('#colecao').scrollIntoView({behavior:'smooth'});toast('Seus favoritos estão salvos neste aparelho')}
 if(a==='add')add();
 if(a==='cart')cart();
 if(a==='closeCart'||a==='closeProduct'||a==='closeCheckout')closeAll();
 if(a==='inc')adjust(b.dataset.key,1);
 if(a==='dec')adjust(b.dataset.key,-1);
 if(a==='remove'){state.cart=state.cart.filter(x=>x.key!==b.dataset.key);save();renderCart()}
 if(a==='checkout'){if(state.cart.length){lastFocus=document.activeElement;$('#cartDrawer').hidden=true;openCheckout(state.cart,catalog,()=>{closeAll()});lock()}}
 if(a==='account')toast('Login estará disponível quando a autenticação for conectada');
 if(a==='clearSearch'){$('#searchTerm').value='';state.search='';render()}
});
document.addEventListener('click',e=>{const a=e.target.closest('a[data-cat]');if(a){state.cat=a.dataset.cat;if(!$('#mobileMenu').hidden)menu();render()}});
$('#searchTerm').addEventListener('input',e=>{state.search=e.target.value;render()});
$('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render()});
$('#scrim').addEventListener('click',closeAll);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#mobileMenu').hidden)menu();else closeAll()}});
$('#year').textContent=new Date().getFullYear();render();