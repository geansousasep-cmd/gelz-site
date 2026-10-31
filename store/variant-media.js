// GELZ Store — associa imagens à cor somente quando há evidência suficiente.
// Metadados de SKU/fotos têm prioridade; inferência visual é progressiva e conservadora.
const cache = new Map();
const accents = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const normalize = value => accents(value).replace(/\b(preta|preto)\b/g,'preto').replace(/\b(branca|branco)\b/g,'branco').replace(/\b(vermelha|vermelho)\b/g,'vermelho').replace(/\b(amarela|amarelo)\b/g,'amarelo').replace(/[^a-z0-9]+/g,' ').trim();
const colorKey = label => {
 const s=normalize(label);
 // Variações com tipos de blusa diferentes não podem ser identificadas apenas pela cor.
 return ['azul marinho','azul royal','azul claro','azul bebe','rosa claro','rosa bebe','verde menta','verde oliva',
 'preto','branco','vermelho','vinho','marrom','bege','rosa','azul','verde','amarelo','lilas','cinza']
 .find(c=>s.includes(c)) || null;
};
export function variantMedia(product,colorName) {
 const color=product.colors.find(c=>c.name===colorName)||product.colors[0];
 if(color?.image)return {images:[color.image],verified:true,source:'arquivo identificado por cor'};
 const key=colorKey(color?.name);
 const named=(product.images||[]).filter(url=>{
  const filename=decodeURIComponent(url.split('?')[0].split('/').pop()||'');
  return key && normalize(filename).includes(key);
 });
 if(named.length)return {images:named,verified:true,source:'nome do arquivo'};
 return {images:product.images||[],verified:product.colors.length===1,source:'fotos gerais do produto'};
}
function shade(rgb) {
 const [r,g,b]=rgb.map(v=>v/255), hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;
 const v=hi, sat=hi===0?0:d/hi;let hue=0;
 if(d>0){switch(hi){case r:hue=((g-b)/d)%6;break;case g:hue=(b-r)/d+2;break;default:hue=(r-g)/d+4}hue=(hue*60+360)%360}
 return {hue,sat,v};
}
function targetHue(key) {
 if(!key)return null;
 if(/azul/.test(key))return [190,255];
 if(/rosa|vinho/.test(key))return [295,360];
 if(/vermelho/.test(key))return [345,25];
 if(/verde/.test(key))return [80,180];
 if(/amarelo/.test(key))return [35,75];
 if(/lilas/.test(key))return [255,315];
 if(/marrom|bege/.test(key))return [14,49];
 return null; // Evita inferir branco, preto e cinza a partir do fundo da foto.
}
async function analyzeImage(url,keys){
 const palettes=keys.map(key=>({key,range:targetHue(key)})).filter(x=>x.range);
 const empty=palettes.map(x=>({key:x.key,value:0}));
 if(!palettes.length)return {url,score:empty};
 try{
  const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer';
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});
  const canvas=document.createElement('canvas');canvas.width=54;canvas.height=64;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return {url,score:empty};
  ctx.drawImage(image,0,0,54,64);
  const pixels=ctx.getImageData(0,0,54,64).data;
  let count=0;const tally=new Map(palettes.map(x=>[x.key,0]));
  for(let y=11;y<56;y+=2)for(let x=12;x<42;x+=2){
   const i=(y*54+x)*4;if(pixels[i+3]<200)continue;
   const c=shade([pixels[i],pixels[i+1],pixels[i+2]]);
   if(c.sat<.2||c.v<.17||c.v>.96)continue;
   count++;
   for(const {key,range} of palettes){
    const match=range[0]>range[1]?(c.hue>=range[0]||c.hue<=range[1]):(c.hue>=range[0]&&c.hue<=range[1]);
    if(match)tally.set(key,tally.get(key)+1);
   }
  }
  return {url,score:palettes.map(x=>({key:x.key,value:count>=80?tally.get(x.key)/count:0}))};
 }catch{return {url,score:empty}} // Mídias sem CORS permanecem ilustrativas.
}
async function detect(product){
 if(cache.has(product.id))return cache.get(product.id);
 const keys=[...new Set(product.colors.map(c=>colorKey(c.name)).filter(Boolean))];
 const work=Promise.all((product.images||[]).slice(0,12).map(url=>analyzeImage(url,keys)));
 cache.set(product.id,work);return work;
}
// Callbacks só substituem a galeria quando a identificação é de alta confiança.
// Se a fonte não autorizar leitura CORS, a galeria padrão permanece como referência.
export async function detectColorMedia(product,colorName){
 const initial=variantMedia(product,colorName);
 if(initial.verified||product.colors.length<2||!product.images?.length)return initial;
 const key=colorKey(colorName);if(!targetHue(key))return initial;
 const analyzed=await detect(product);
 const matches=analyzed.filter(x=>{
  const thisScore=x.score.find(c=>c.key===key)?.value||0;
  const others=Math.max(0,...x.score.filter(c=>c.key!==key).map(c=>c.value));
  return thisScore>=.58&&thisScore-others>=.2;
 }).map(x=>x.url);
 return matches.length?{images:matches,verified:true,source:'cor identificada na fotografia'}:initial;
}
