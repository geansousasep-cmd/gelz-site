const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('enter');reveal.unobserve(entry.target)}
}));
document.querySelectorAll('.heroText,.heading,.feature>div,.contact>div').forEach(el=>reveal.observe(el));
document.querySelectorAll('.rail').forEach(rail=>{
  const step=()=>rail.firstElementChild.offsetWidth+12;
  const move=dir=>rail.scrollBy({left:dir*step(),behavior:reduced?'instant':'smooth'});
  rail.parentElement.querySelectorAll('[data-dir]').forEach(btn=>btn.onclick=()=>move(Number(btn.dataset.dir)));
  rail.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}};
  let origin,offset;
  rail.onpointerdown=e=>{if(e.pointerType!=='mouse'||e.button!==0)return;origin=e.clientX;offset=rail.scrollLeft;rail.setPointerCapture(e.pointerId);rail.classList.add('drag')};
  rail.onpointermove=e=>{if(origin!==undefined)rail.scrollLeft=offset+origin-e.clientX};
  rail.onlostpointercapture=()=>{origin=undefined;rail.classList.remove('drag')};
});
const video=document.querySelector('video');
new IntersectionObserver(([entry])=>{
  if(entry.intersectionRatio>=0.5){
    if(!video.src)video.src=video.dataset.src;
    if(!reduced)video.play().catch(()=>{});
  }else{video.pause()}
},{threshold:[0,.5]}).observe(video);
document.querySelector('form').onsubmit=e=>{
  e.preventDefault();
  const fields=new FormData(e.currentTarget);
  location.href='https://wa.me/5511988885932?text='+encodeURIComponent('Olá, Júnior! Meu nome é '+fields.get('nome').trim()+'. Gostaria de conversar sobre o seguinte assunto: '+fields.get('assunto')+'.');
};
const popup=document.querySelector('dialog');
document.querySelectorAll('.tile').forEach(tile=>tile.onclick=()=>{
  popup.querySelector('h3').textContent=tile.querySelector('b').textContent;
  popup.querySelector('p').textContent=tile.dataset.body;
  const source=popup.querySelector('a');
  source.style.display=tile.dataset.url?'inline-block':'none';
  source.href=new URL(tile.dataset.url === '/' ? '/' : tile.dataset.url+'/', 'https://quattroinvestimentos.com.br').href;
  popup.showModal();
});
popup.querySelector('button').onclick=()=>popup.close();
popup.onclick=e=>{if(e.target===popup && !popup.getBoundingClientRect().toJSON().width)return; if(e.target===popup){const b=popup.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)popup.close()}};
if(!reduced){
 const counts=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  counts.unobserve(entry.target);
  const el=entry.target,final=el.textContent,match=final.match(/[\d,]+/),num=Number(match[0].replace(',','.')),digits=(match[0].split(',')[1]||'').length,start=performance.now();
  function tick(now){const t=Math.min(1,(now-start)/1250);el.textContent=t===1?final:final.replace(match[0],(num*(1-(1-t)**3)).toFixed(digits).replace('.',','));if(t<1)requestAnimationFrame(tick)}
  requestAnimationFrame(tick);
 }),{threshold:.6});
 document.querySelectorAll('.metrics b').forEach(el=>counts.observe(el));
}
