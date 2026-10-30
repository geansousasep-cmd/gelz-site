import {catalog} from './catalog-v2.js';
import {descriptions} from './description-v3.js';
const $=selector=>document.querySelector(selector);
const clean=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const productId=new URLSearchParams(location.search).get('id');
const p=catalog.find(item=>item.id===productId);
const raw=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
let chosenColor=null,chosenSize=null,photoIndex=0,zoomTimer=0,toastTimer=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function images(){
 const color=p.colors.find(c=>c.name===chosenColor);
 return [...new Set([color?.image,...p.images].filter(Boolean))];
}
function activeColor(){return p.colors.find(c=>c.name===chosenColor)||p.colors[0]}
function toast(message){
 const n=$('#detailToast');n.textContent=message;n.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),2800);
}
function count(){
 const n=raw('gelz:cart',[]).reduce((s,x)=>s+Math.max(0,Number(x.qty)||0),0);
 $('#cartBadge').hidden=n===0;$('#cartBadge').textContent=n;
}
function drawGallery(){
 const album=images();const index=Math.min(photoIndex,album.length-1),src=album[index]||'../gelz-logo.webp';
 photoIndex=Math.max(0,index);
 const image=$('#bigPhoto');
 if(image.getAttribute('src')!==src){image.classList.remove('photo-changing');void image.offsetWidth;image.src=src;image.classList.add('photo-changing')}
 image.alt=p.name+' — imagem '+(photoIndex+1);
 $('#galleryCounter').textContent=String(photoIndex+1).padStart(2,'0')+' / '+String(album.length).padStart(2,'0');
 $('#thumbnailRow').innerHTML=album.map((src,i)=>'<button class="'+(i===photoIndex?'selected':'')+'" data-photo="'+i+'" aria-label="Ver imagem '+(i+1)+'" aria-current="'+(i===photoIndex)+'"><img loading="lazy" src="'+clean(src)+'" alt=""></button>').join('');
 $('#galleryDots').innerHTML=album.slice(0,9).map((_,i)=>'<button class="'+(i===photoIndex?'active':'')+'" data-photo="'+i+'" aria-label="Foto '+(i+1)+'"></button>').join('');
 const c=activeColor();
 $('#photoNote').textContent=c.image?'Veja a cor selecionada e os detalhes do modelo.':'Fotos do modelo e detalhes da coleção. As opções de cor estão disponíveis acima.';
}
function drawOptions(){
 $('#selectedColor').textContent=chosenColor;
 $('#productColors').innerHTML=p.colors.map(c=>'<button data-color="'+clean(c.name)+'" class="'+(chosenColor===c.name?'selected':'')+'" title="'+clean(c.name)+'" aria-label="Cor '+clean(c.name)+'" aria-pressed="'+(chosenColor===c.name)+'" style="--color:'+c.hex+'"></button>').join('');
 const color=activeColor();$('#selectedSize').textContent=chosenSize||'Selecione';
 $('#productSizes').innerHTML=color.sizes.map(size=>'<button data-size="'+clean(size)+'" aria-pressed="'+(size===chosenSize)+'" class="'+(size===chosenSize?'selected':'')+'">'+clean(size)+'</button>').join('');
}
function drawRelated(){
 const others=catalog.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4);
 $('#relatedProducts').innerHTML=others.map(x=>'<a href="./product.html?id='+encodeURIComponent(x.id)+'" class="related-card"><img loading="lazy" src="'+clean(x.image)+'" alt="'+clean(x.name)+'"><strong>'+clean(x.name)+'</strong><small>'+money(x.price)+'</small></a>').join('');
}
function saveCart(){
 if(!chosenSize){$('#formError').textContent='Selecione um tamanho antes de adicionar à sacola.';return}
 const cart=raw('gelz:cart',[]).filter(x=>catalog.some(p=>p.id===x.id));
 const key=p.id+'|'+chosenColor+'|'+chosenSize;
 const existing=cart.find(x=>x.key===key);
 if(existing)existing.qty=Math.min(10,existing.qty+1);
 else cart.push({key,id:p.id,color:chosenColor,size:chosenSize,qty:1});
 try{localStorage.setItem('gelz:cart',JSON.stringify(cart))}catch{}
 count();toast('Peça adicionada à sua sacola');openBag();
}
function openBag(){
 const cart=raw('gelz:cart',[]).filter(x=>catalog.some(p=>p.id===x.id));
 $('#bagItems').innerHTML=cart.length?cart.map(item=>{
 const product=catalog.find(x=>x.id===item.id),color=product.colors.find(c=>c.name===item.color);
 return '<div class="bag-line"><img src="'+clean(color?.image||product.image)+'" alt="'+clean(product.name)+'"><div><h3>'+clean(product.name)+'</h3><p>'+clean(item.color)+' / '+clean(item.size)+' · '+item.qty+' unidade(s)</p><strong>'+money(product.price*item.qty)+'</strong></div></div>'
 }).join(''):'<p>Sua sacola está vazia.</p>';
 $('#bagSheet').hidden=false;$('#bagShade').hidden=false;document.body.classList.add('is-locked');
}
function closeBag(){$('#bagSheet').hidden=true;$('#bagShade').hidden=true;document.body.classList.remove('is-locked')}
function favorites(){
 const fav=new Set(raw('gelz:favs',[]));
 if(fav.has(p.id)){fav.delete(p.id);toast('Removido dos favoritos')}else{fav.add(p.id);toast('Salvo nos favoritos')}
 try{localStorage.setItem('gelz:favs',JSON.stringify([...fav]))}catch{}
 $('#saveFavorite').classList.toggle('favorite-active',fav.has(p.id));
}
function photoChange(shift){
 const len=images().length;if(len<2)return;
 photoIndex=(photoIndex+shift+len)%len;drawGallery();
}
function setupGallery(){
 const area=$('#galleryStage');let touchX=0,touchY=0;
 area.addEventListener('touchstart',e=>{if(e.touches.length===1){touchX=e.touches[0].clientX;touchY=e.touches[0].clientY}},{passive:true});
 area.addEventListener('touchend',e=>{if(!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>46&&Math.abs(dx)>Math.abs(dy)*1.3)photoChange(dx<0?1:-1)},{passive:true});
 area.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;zoomTimer=setTimeout(()=>area.classList.add('is-zooming'),330)});
 for(const event of ['pointerup','pointercancel','pointerleave'])area.addEventListener(event,()=>{clearTimeout(zoomTimer);area.classList.remove('is-zooming')});
 $('#bigPhoto').addEventListener('error',()=>{const image=$('#bigPhoto');if(!image.dataset.fallback){image.dataset.fallback='1';image.src='../gelz-logo.webp'}});
 $('#nextPhoto').addEventListener('click',()=>photoChange(1));$('#prevPhoto').addEventListener('click',()=>photoChange(-1));
 for(const parent of ['#thumbnailRow','#galleryDots'])$(parent).addEventListener('click',e=>{const item=e.target.closest('[data-photo]');if(item){photoIndex=+item.dataset.photo;drawGallery()}});
}
function init(){
 if(!p){$('#productMain').innerHTML='<div style="min-height:65vh;padding:80px 22px;text-align:center"><h1>Peça não encontrada.</h1><p>Volte para explorar a coleção GELZ.</p><a class="btn btn-black" href="./">VER COLEÇÃO ↗</a></div>';return}
 const fromLink=new URLSearchParams(location.search).get('color');
 chosenColor=p.colors.some(c=>c.name===fromLink)?fromLink:p.colors[0].name;
 document.title=p.name+' · GELZ STORE';
 $('#crumbCategory').textContent=p.category;
 $('#productTitle').textContent=p.name;
 $('#productPrice').textContent=money(p.price);
 $('#addPrice').textContent=money(p.price);
 const desc=descriptions[p.id];
 $('#productDescription').textContent=desc||'Conheça as opções de cores e tamanhos deste modelo da coleção GELZ Store.';
 $('#productSpecs').textContent='Tamanhos disponíveis: '+[...new Set(p.colors.flatMap(x=>x.sizes))].join(', ')+'.\nCores disponíveis: '+p.colors.map(x=>x.name).join(', ')+'.\nConsulte a disponibilidade da sua seleção quando as vendas forem ativadas.';
 drawOptions();drawGallery();drawRelated();setupGallery();count();
 $('#productColors').addEventListener('click',e=>{
 const button=e.target.closest('[data-color]');if(!button)return;
 chosenColor=button.dataset.color;chosenSize=null;photoIndex=0;$('#formError').textContent='';
 history.replaceState(null,'','./product.html?id='+encodeURIComponent(p.id)+'&color='+encodeURIComponent(chosenColor));
 drawOptions();drawGallery();
 });
 $('#productSizes').addEventListener('click',e=>{const button=e.target.closest('[data-size]');if(!button)return;chosenSize=button.dataset.size;$('#formError').textContent='';drawOptions()});
 $('#addToBag').addEventListener('click',saveCart);
 $('#openCart').addEventListener('click',openBag);$('#mobileCart').addEventListener('click',openBag);
 $('#closeBag').addEventListener('click',closeBag);$('#bagShade').addEventListener('click',closeBag);
 $('#saveFavorite').addEventListener('click',favorites);
 $('#saveFavorite').classList.toggle('favorite-active',raw('gelz:favs',[]).includes(p.id));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBag();else if(e.key==='ArrowLeft')photoChange(-1);else if(e.key==='ArrowRight')photoChange(1)});
 if(!reduced&&'IntersectionObserver'in window){
  const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');obs.unobserve(entry.target)}}),{threshold:.08});
  document.querySelectorAll('.product-summary,.related-heading,.related-card').forEach(el=>{el.dataset.reveal='true';obs.observe(el)})
 }
}
let lastY=scrollY,travelDown=0,travelUp=0,schedule=false;
window.addEventListener('scroll',()=>{
 if(schedule)return;schedule=true;requestAnimationFrame(()=>{
 schedule=false;const pill=$('.mobile-bottom');if(!pill)return;
 const y=scrollY,d=y-lastY;lastY=y;
 if(y<65){pill.classList.remove('is-compact');travelDown=travelUp=0}
 else if(d>1){travelDown+=d;travelUp=0;if(travelDown>26)pill.classList.add('is-compact')}
 else if(d< -1){travelUp+=-d;travelDown=0;if(travelUp>22)pill.classList.remove('is-compact')}
 })
},{passive:true});
init();