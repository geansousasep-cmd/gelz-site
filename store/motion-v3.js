
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const pill=document.querySelector('.mobile-bottom');
let lastY=window.scrollY,down=0,up=0,ticking=false;
function onFrame(){
 const y=Math.max(0,window.scrollY),delta=y-lastY;
 lastY=y;ticking=false;
 if(!pill)return;
 if(y<65){down=0;up=0;pill.classList.remove('is-compact');return}
 if(delta>1.2){down+=delta;up=0;if(down>28)pill.classList.add('is-compact')}
 else if(delta< -1.2){up+=-delta;down=0;if(up>22)pill.classList.remove('is-compact')}
}
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onFrame)}},{passive:true});
const observer=('IntersectionObserver'in window&&!reduced)?new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}
},{threshold:.08,rootMargin:'0px 0px -18px 0px'}):null;
function reveal(){
 if(!observer)return;
 document.querySelectorAll('.section-intro,.section-head,.feature-aside,.campaign-content,.editorial-footer,.cluster-title,.product-card').forEach((node,i)=>{
  if(node.dataset.reveal)return;node.dataset.reveal='true';node.style.transitionDelay=(i%4)*55+'ms';observer.observe(node)
 });
}
reveal();
const grid=document.querySelector('#productGrid');
if(grid&&window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(reveal)).observe(grid,{childList:true});
let held=null,timer=null;
document.addEventListener('pointerdown',e=>{
 const card=e.target.closest('.product-card');
 if(!card||e.target.closest('.card-colors,.card-favorite')||e.button>0)return;
 held=card;clearTimeout(timer);timer=setTimeout(()=>card.classList.add('is-pressed'),170)
},{passive:true});
function release(){clearTimeout(timer);if(held){held.classList.remove('is-pressed');held=null}}
document.addEventListener('pointerup',release,{passive:true});
document.addEventListener('pointercancel',release,{passive:true});
window.addEventListener('blur',release);
