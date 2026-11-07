// Avaliações originais do anúncio Nike TN enviadas pela loja.
// Vinculadas apenas ao produto correto (sem capuz); sem uso em outros produtos.
const tnId='1737402795005347743';
const currentId=new URLSearchParams(location.search).get('id');
const reviews=[
 {name:'ف**س',variant:'Azul bebê · M',text:'muito bom e bnt, veio tudo certinho e ele só é bem fino e melhor doq eu esperava, d resto é bom e o único "problema" é q a gola é mt grande',photo:0},
 {name:'a**3',variant:'Azul bebê · G',text:'Chegou no prazo previsto, estão de parabéns 👏👏 achei top',photo:1},
 {name:'@**O P**$',variant:'Branco · M',text:'Material: Top qualidade muito boa e bonita. Cor: Branco e top',photo:2},
 {name:'r**a ***',variant:'Vermelho · M',text:'Conjunto toop amei 🥰',photo:3},
 {name:'R**e',variant:'Branco · M',text:'Material: Maravilhoso. Cor: Branco maravilhoso',photo:4},
 {name:'S**j',variant:'Azul bebê · G',text:'Tenho 1,70 aproximadamente peso 65kg e o tamanho G é ótimo, logo da nike bordada',photo:5}
];
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(currentId===tnId){
 const anchor=document.querySelector('#productSummary .delivery-caption');
 if(anchor){
  const section=document.createElement('section');section.className='gelz-reviews';section.setAttribute('aria-label','Avaliações dos clientes do conjunto Nike TN');
  section.innerHTML='<div class="gelz-reviews-title"><h2>Avaliações de quem comprou</h2><span class="gelz-reviews-summary"><span class="stars">★★★★★</span> 5,0 nas 6 avaliações exibidas</span></div>'
    +'<div class="gelz-review-list">'+reviews.map((r,i)=>'<article class="gelz-review" '+(i>=3?'hidden':'')+'><div class="gelz-review-photo" data-index="'+r.photo+'" role="img" aria-label="Foto enviada pelo cliente"></div><div class="gelz-review-copy"><div class="gelz-review-meta"><strong>'+esc(r.name)+'</strong><small>'+esc(r.variant)+'</small></div><div class="gelz-review-stars" aria-label="5 de 5 estrelas">★★★★★</div><p>'+esc(r.text)+'</p></div></article>').join('')+'</div>'
    +'<button class="gelz-reviews-toggle" type="button" aria-expanded="false">Ver todas as 6 avaliações</button>';
  anchor.insertAdjacentElement('afterend',section);
  const toggle=section.querySelector('.gelz-reviews-toggle');
  toggle.addEventListener('click',()=>{
   const expanded=toggle.getAttribute('aria-expanded')!=='true';
   section.querySelectorAll('.gelz-review[hidden],.gelz-review:nth-child(n+4)').forEach((card,i)=>{card.hidden=!expanded});
   toggle.setAttribute('aria-expanded',String(expanded));
   toggle.textContent=expanded?'Mostrar menos':'Ver todas as 6 avaliações';
  });
 }
}
