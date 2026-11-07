import {catalog} from './catalog-v2.js';
import {orderWhatsAppUrl} from './whatsapp.js?v=20261107-2';
import {variantMedia,detectColorMedia} from './variant-media.js';
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const get=id=>catalog.find(p=>p.id===id);
const normal=t=>String(t??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const brandTagsById={
 '1737402795005347743':['nike','tn','nike tn'],
 '1737492614665439135':['nike'],
 '1737402743979542431':['louis vuitton','lv']
};
const isProductMatch=(p,query)=>normal([p.name,p.category,p.description||'',p.brand||'',...(p.tags||[]),...(brandTagsById[p.id]||[])].join(' ')).includes(normal(query));
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return []}};
const state={cat:'Masculino',search:'',sort:'featured',sizeFilter:'',colorFilter:'',priceFilter:'',colors:{},favs:new Set(read('gelz:favs')),cart:read('gelz:cart').filter(x=>get(x.id)),active:null,size:null,photo:0};
let lastFocus,toastTimer;
const picked=p=>p.colors.find(c=>c.name===state.colors[p.id])||p.colors.find(c=>c.name===state.colorFilter)||p.colors[0];
const pics=p=>variantMedia(p,picked(p).name).images;
const swatch=(p,c,detail)=>`<button data-action="${detail?'selectColor':'cardColor'}" data-id="${p.id}" data-color="${esc(c.name)}" class="${picked(p).name===c.name?'selected':''}" style="--swatch:${c.hex}" aria-label="${esc(c.name)}" title="${esc(c.name)}" aria-pressed="${picked(p).name===c.name}"></button>`;
function save(){try{localStorage.setItem('gelz:favs',JSON.stringify([...state.favs]));localStorage.setItem('gelz:cart',JSON.stringify(state.cart))}catch{}}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800)}
function badge(){const n=state.cart.reduce((s,x)=>s+x.qty,0);$('#cartBadge').hidden=n===0;$('#cartBadge').textContent=n;$('#cartQty').textContent=n}
function lock(){const active=!$('#cartDrawer').hidden||!$('#productOverlay').hidden;document.body.classList.toggle('is-locked',active);$('#scrim').hidden=!active}
function closeAll(){$('#cartDrawer').hidden=$('#productOverlay').hidden=true;lock();lastFocus?.focus?.()}
function filterOptions(){
 const scope=catalog.filter(p=>state.cat==='Todas'||p.category===state.cat);
 const sizes=[...new Set(scope.flatMap(p=>p.colors.flatMap(c=>c.sizes)))];
 const order=['PP','P','M','G','GG','XG','XGG','2','4','6','8','10','12','14','16','18'];
 sizes.sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b,'pt-BR',{numeric:true})});
 const colors=[...new Set(scope.flatMap(p=>p.colors.map(c=>c.name)))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 if(state.sizeFilter&&!sizes.includes(state.sizeFilter))state.sizeFilter='';
 if(state.colorFilter&&!colors.includes(state.colorFilter))state.colorFilter='';
 $('#sizeFilter').innerHTML='<option value="">Todos os tamanhos</option>'+sizes.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
 $('#colorFilter').innerHTML='<option value="">Todas as cores</option>'+colors.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 $('#sizeFilter').value=state.sizeFilter;
 $('#colorFilter').value=state.colorFilter;
 $('#priceFilter').value=state.priceFilter;
 $('#sortSelect').value=state.sort;
 $('#resetFilters').hidden=!(state.sizeFilter||state.colorFilter||state.priceFilter||state.search||state.sort!=='featured');
}
function filtered(){
 let result=catalog.filter(p=>{
  if(state.cat!=='Todas'&&p.category!==state.cat)return false;
  if(state.search&&!isProductMatch(p,state.search))return false;
  if(!p.colors.some(c=>(!state.colorFilter||c.name===state.colorFilter)&&(!state.sizeFilter||c.sizes.includes(state.sizeFilter))))return false;
  if(state.priceFilter==='0-60'&&p.price>60)return false;
  if(state.priceFilter==='60-90'&&(p.price<60||p.price>90))return false;
  if(state.priceFilter==='90+'&&p.price<=90)return false;
  return true;
 });
 if(state.sort==='low')result.sort((a,b)=>a.price-b.price);
 if(state.sort==='high')result.sort((a,b)=>b.price-a.price);
 if(state.sort==='az')result.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 return result;
}
function render(){
 $('#categoryTabs').innerHTML=['Masculino','Feminino','Infantil','Todas'].map(c=>`<button class="${c===state.cat?'active':''}" data-action="category" data-category="${c}" aria-pressed="${c===state.cat}">${c==='Todas'?'Todos':c}</button>`).join('');
 filterOptions();
 const items=filtered();$('#resultCount').textContent=`${items.length} ${items.length===1?'PRODUTO ENCONTRADO':'PRODUTOS ENCONTRADOS'}`;
 $('#activeCollection').textContent=state.cat==='Todas'?'Toda a coleção':state.cat;
 const card=p=>`<article class="product-card">
 <div class="card-image"><img src="${esc(variantMedia(p,picked(p).name).images[0]||p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='../gelz-logo.webp'">
 <button class="card-click" data-action="detail" data-id="${p.id}" aria-label="Ver ${esc(p.name)}"></button>
 <span class="card-label">GELZ EDITION</span>
 <button class="card-favorite ${state.favs.has(p.id)?'saved':''}" data-action="favorite" data-id="${p.id}" aria-label="Salvar favorito">${state.favs.has(p.id)?'♥':'♡'}</button></div>
 <div class="card-info"><div class="card-caption"><span>${p.category}</span><span>GELZ STORE</span></div>
 <h3 data-action="detail" data-id="${p.id}">${esc(p.name)}</h3><div class="card-price">${money(p.price)}</div>
 <div class="card-colors" role="group" aria-label="Cores disponíveis">${p.colors.slice(0,8).map(c=>swatch(p,c,false)).join('')}${p.colors.length>8?`<span>+${p.colors.length-8}</span>`:''}</div><small class="media-accuracy" data-media-note>${variantMedia(p,picked(p).name).verified?'Foto da cor selecionada':'Foto ilustrativa · cor não confirmada'}</small>
 </div></article>`;
 const groups=state.cat==='Todas'?['Masculino','Feminino','Infantil']:[state.cat];
 const labels={Feminino:['01 / FEMININO','Moda feminina'],Masculino:['02 / MASCULINO','Moda masculina'],Infantil:['03 / INFANTIL','Moda infantil']};
 $('#productGrid').innerHTML=groups.map(c=>{
 const products=items.filter(p=>p.category===c);if(!products.length)return '';
 const title=labels[c]||['GELZ','Coleção'];
 return `<section class="collection-cluster" id="${c.toLowerCase()}"><header class="cluster-title">
 <div><p class="eyebrow">${title[0]}</p><h3>${title[1]}</h3></div><p>${products.length} ${products.length===1?'produto':'produtos'}</p></header>${products.map(card).join('')}</section>`
 }).join('')||'<div class="empty-state">Nenhuma peça encontrada. Experimente outro filtro.</div>';
 badge();
}
function product(id){state.active=id;state.size=null;state.photo=0;lastFocus=document.activeElement;$('#cartDrawer').hidden=true;$('#productOverlay').hidden=false;renderProduct();lock()}
function renderProduct(){
 const p=get(state.active);if(!p)return;const c=picked(p),gallery=pics(p),main=gallery[Math.min(state.photo,gallery.length-1)]||p.image;
 $('#productContents').innerHTML=`<div class="detail-layout"><div class="detail-visual"><img class="detail-image" src="${esc(main)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='../gelz-logo.webp'"><div class="thumbs">${gallery.slice(0,9).map((img,i)=>`<button data-action="photo" data-index="${i}" class="${state.photo===i?'active':''}" aria-label="Foto ${i+1}"><img src="${esc(img)}" alt="" loading="lazy"></button>`).join('')}</div></div><div class="detail-info">
 <p class="eyebrow">${p.category} / GELZ STORE</p><h2 id="detailTitle">${esc(p.name)}</h2><div class="price">${money(p.price)}</div>
 <div class="variation-label">Cor: <span>${esc(c.name)}</span></div><div class="detail-colors">${p.colors.map(co=>swatch(p,co,true)).join('')}</div>
 <div class="variation-label">Selecione o tamanho <span>${state.size?'· '+esc(state.size):''}</span></div><div class="detail-sizes">${c.sizes.map(sz=>`<button data-action="size" data-size="${esc(sz)}" class="${state.size===sz?'selected':''}" aria-pressed="${state.size===sz}">${esc(sz)}</button>`).join('')}</div>
 <p id="detailError" class="detail-error"></p><button data-action="add" class="btn btn-black buy-button">ADICIONAR À SACOLA <span>↗</span></button><p class="disable-callout">Finalize pelo WhatsApp. O atendimento confirma disponibilidade, valor final e frete.</p>
 <div class="specs"><p>${c.image?'Foto desta cor identificada no acervo Gelz.':'O arquivo TikTok não identifica as fotos por cor. Estas fotos são do modelo, não da variante selecionada.'}</p><p>Variações e preços importados dos anúncios.</p></div>
 </div></div>`;
}
function add(){const p=get(state.active);if(!state.size){$('#detailError').textContent='Escolha um tamanho para continuar.';return}const color=picked(p).name,key=p.id+'|'+color+'|'+state.size;let x=state.cart.find(x=>x.key===key);if(x)x.qty=Math.min(10,x.qty+1);else state.cart.push({key,id:p.id,color,size:state.size,qty:1});save();toast('Produto adicionado à sacola');cart()}
function cart(){lastFocus=document.activeElement;$('#productOverlay').hidden=true;$('#cartDrawer').hidden=false;renderCart();lock()}
function renderCart(){
 const total=state.cart.reduce((s,x)=>s+get(x.id).price*x.qty,0);$('#cartSubtotal').textContent=money(total);
 $('#cartContents').innerHTML=state.cart.length?state.cart.map(x=>{const p=get(x.id),photo=variantMedia(p,x.color).images[0]||p.image;return `<div class="cart-item"><img src="${esc(photo)}" alt="${esc(p.name)}"><div class="cart-item-info"><h3>${esc(p.name)}</h3><small>${esc(x.color)} / ${esc(x.size)}</small><div class="cart-item-bottom"><div class="quantity"><button data-action="dec" data-key="${esc(x.key)}">−</button><span>${x.qty}</span><button data-action="inc" data-key="${esc(x.key)}">+</button></div><b class="cart-item-price">${money(p.price*x.qty)}</b></div><button data-action="remove" data-key="${esc(x.key)}" style="background:none;border:0;padding:12px 0;text-decoration:underline;font-size:11px">Remover</button></div></div>`}).join(''):'<div class="empty-cart">Sua sacola está vazia.<br>Descubra sua próxima peça na coleção.</div>';
 $('#checkoutButton').disabled=state.cart.length===0;badge();
}
function adjust(key,qty){const x=state.cart.find(x=>x.key===key);if(!x)return;x.qty=Math.max(0,Math.min(10,x.qty+qty));state.cart=state.cart.filter(x=>x.qty>0);save();renderCart()}
function search() {closeAll();$('#searchPanel').hidden=false;$('#colecao').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchTerm').focus(),200)}
let menuCloseTimer;
function menu(){
 const panel=$('#mobileMenu');
 clearTimeout(menuCloseTimer);
 if(panel.classList.contains('is-open')){
  panel.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  menuCloseTimer=setTimeout(()=>{if(!panel.classList.contains('is-open'))panel.hidden=true},350);
 }else{
  panel.hidden=false;
  requestAnimationFrame(()=>panel.classList.add('is-open'));
  document.body.classList.add('is-locked');
 }
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==='menu')menu();
 if(a==='category'){state.cat=b.dataset.category;state.search='';$('#searchTerm').value='';render()}
 if(a==='search')search();
  if(a==='toggleFilters'){const panel=$('#filterControls');panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden))}
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
   const selectedColor=b.dataset.color;
   const immediate=variantMedia(p,selectedColor);
   const target=immediate.images[0]||p.image;
   const show=(media)=>{
    if(state.colors[id]!==selectedColor)return;
    const note=card.querySelector('[data-media-note]');
    if(note)note.textContent=media.verified?'Foto da cor selecionada':'Foto ilustrativa · cor não confirmada';
    const candidate=media.images[0]||p.image;
    if(img&&img.getAttribute('src')!==candidate){
     img.classList.remove('photo-changing');
     void img.offsetWidth;
     img.src=candidate;
     img.classList.add('photo-changing');
    }
   };
   show(immediate);
   if(!immediate.verified)detectColorMedia(p,selectedColor).then(show).catch(()=>{});
  }
 }
 if(a==='selectColor'){state.colors[id]=b.dataset.color;state.size=null;state.photo=0;renderProduct()}
 if(a==='photo'){state.photo=+b.dataset.index;renderProduct()}
 if(a==='size'){state.size=b.dataset.size;renderProduct()}
 if(a==='favorite'){state.favs.has(id)?state.favs.delete(id):state.favs.add(id);save();render();toast('Favoritos salvos neste aparelho')}
 if(a==='favorites'){state.cat='Todas';render();$('#colecao').scrollIntoView({behavior:'smooth'});toast('Seus favoritos estão salvos neste aparelho')}
 if(a==='add')add();
 if(a==='cart')cart();
 if(a==='closeCart'||a==='closeProduct'||a==='closeCheckout')closeAll();
 if(a==='inc')adjust(b.dataset.key,1);
 if(a==='dec')adjust(b.dataset.key,-1);
 if(a==='remove'){state.cart=state.cart.filter(x=>x.key!==b.dataset.key);save();renderCart()}
 if(a==='checkout'&&state.cart.length)window.location.assign(orderWhatsAppUrl(state.cart,catalog));
 if(a==='clearSearch'){$('#searchTerm').value='';state.search='';render()}
 if(a==='resetFilters'){state.sizeFilter=state.colorFilter=state.priceFilter=state.search='';state.sort='featured';$('#searchTerm').value='';render()}
});
document.addEventListener('click',e=>{const a=e.target.closest('a[data-cat]');if(a){state.cat=a.dataset.cat;state.search='';$('#searchTerm').value='';if($('#mobileMenu').classList.contains('is-open'))menu();render()}});
$('#searchTerm').addEventListener('input',e=>{state.search=e.target.value;if(state.search.trim())state.cat='Todas';render()});
$('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render()});
$('#sizeFilter').addEventListener('change',e=>{state.sizeFilter=e.target.value;render()});
$('#colorFilter').addEventListener('change',e=>{state.colorFilter=e.target.value;render()});
$('#priceFilter').addEventListener('change',e=>{state.priceFilter=e.target.value;render()});
$('#scrim').addEventListener('click',closeAll);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#mobileMenu').hidden)menu();else closeAll()}});
$('#year').textContent=new Date().getFullYear();render();
if(new URLSearchParams(location.search).get('checkout')==='1'&&state.cart.length){
 history.replaceState(null,'',location.pathname);
 cart();$('#checkoutButton').click();
}
