/* GELZ Prospect — consulta pública CNPJ e filtro geográfico com proveniência.
   Fichário: https://fichario.app/api (API pública, limite e termos do provedor).
   OpenStreetMap: Nominatim + Overpass; somente POIs COM CNPJ explicitamente cadastrado.
   Não é uma busca exaustiva de todas as empresas num raio. */
const API="https://fichario.app/api/v1";
const OPEN_CNPJ="https://kitana.opencnpj.com/cnpj/";
const timeout=12500;
const digits=v=>String(v||"").replace(/\D/g,"");
const str=v=>String(v??"").trim();
const capital=v=>{if(typeof v==="number")return Math.max(0,v);if(v==null)return 0;let s=String(v).replace(/[^\d,.-]/g,"");if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(",",".");let n=Number(s);return Number.isFinite(n)?Math.max(0,n):0;};
const normalizeCnpj=v=>digits(v).slice(0,14);
export function validCNPJ(raw){const c=normalizeCnpj(raw);if(c.length!==14||/^(\d)\1+$/.test(c))return false;for(let length=12;length<=13;length++){let sum=0;let weight=length===12?5:6;for(let i=0;i<length;i++){sum+=Number(c[i])*weight;weight=weight===2?9:weight-1;}let d=sum%11;let expected=d<2?0:11-d;if(Number(c[length])!==expected)return false;}return true;}
async function request(url,{post,limit=timeout}={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),limit);try{const res=await fetch(url,{method:post?"POST":"GET",headers:{accept:"application/json",...(post?{"content-type":"application/json"}:{})},body:post?JSON.stringify(post):undefined,signal:controller.signal});if(!res.ok)throw Error("Serviço respondeu "+res.status+(res.status===429?" (limite excedido)":""));const contentType=res.headers.get("content-type")||"";if(!contentType.includes("json"))throw Error("A fonte não respondeu JSON");return await res.json();}catch(err){if(err.name==="AbortError")throw Error("Tempo limite excedido");if(err instanceof TypeError)throw Error("Fonte indisponível no navegador. Pode ser restrição CORS ou conexão.");throw err;}finally{clearTimeout(timer);}}
const textField=(d,...keys)=>{for(const k of keys){const v=d?.[k];if(v!==undefined&&v!==null&&String(v).trim())return String(v);}return "";};
export function normalize(item={},origin="Fichário"){
const d=item?.empresa||item?.dados||item||{};const addr=d.endereco||d.address||{};
const cnpj=normalizeCnpj(textField(d,"cnpj","documento","cnpj_basico"));
const capitalValue=capital(d.capital_social??d.capitalSocial??d.capital_social_empresa??0);
let phone=textField(d,"telefone","telefone_comercial","ddd_telefone_1","telefone1","telefone1_completo");
if(phone.startsWith("0"))phone=phone.replace(/^0+/,"");
return {
cnpj,company_name:textField(d,"nome_fantasia","razao_social","razaoSocial","nome","fantasia","nome_empresarial")||"Empresa sem nome",
razao_social:textField(d,"razao_social","razaoSocial","nome_empresarial"),
sector:typeof d.atividade_principal==="object"?textField(d.atividade_principal,"descricao"):textField(d,"cnae_fiscal_descricao","atividade_principal_descricao","atividade","cnae_descricao","cnae"),
cnae:typeof d.atividade_principal==="object"?textField(d.atividade_principal,"codigo"):textField(d,"cnae_fiscal","cnae"),
city:textField(addr,"municipio","cidade")||textField(d,"municipio","cidade"),
uf:textField(addr,"uf")||textField(d,"uf"),
neighborhood:textField(addr,"bairro")||textField(d,"bairro"),
cep:digits(textField(addr,"cep")||textField(d,"cep")).slice(0,8),
phone,site:textField(d,"site","website","websiteURI"),
porte:textField(d,"porte","porte_empresa","porteEmpresa"),
capital_social:capitalValue,
situacao:textField(d,"situacao","situacao_cadastral","descricao_situacao_cadastral"),
source:origin,sourceUrl:cnpj?"https://fichario.app/cnpj/"+cnpj:"",verified:!!cnpj&&validCNPJ(cnpj),
raw:d
};}
export function potential(item){
const cap=Number(item.capital_social)||0;const porte=str(item.porte).toUpperCase();
if(!cap&&!porte)return {score:null,label:"Sem dados",evidence:"Sem capital social ou porte"};
let score=35,explanation=[];
if(/DEMAIS|GRANDE/.test(porte)){score+=36;explanation.push("Porte cadastral: demais");}
else if(/EPP|PEQUEN/.test(porte)){score+=21;explanation.push("Porte EPP");}
else if(/ME\b|MICRO/.test(porte)){score+=8;explanation.push("Porte ME");}
if(cap>=10000000){score+=25;explanation.push("Capital declarado ≥ R$ 10 mi");}
else if(cap>=1000000){score+=19;explanation.push("Capital declarado ≥ R$ 1 mi");}
else if(cap>=100000){score+=11;explanation.push("Capital declarado ≥ R$ 100 mil");}
else if(cap>0){score+=4;explanation.push("Capital declarado informado");}
return {score:Math.min(98,score),label:"Indicativo",evidence:explanation.join(" • ")||"Dados cadastrais"};
}
function unwrap(data){const value=data?.resultados||data?.empresas||data?.results||data?.data?.resultados||data?.data?.empresas||data?.data||data?.items||data?.result||data;return Array.isArray(value)?value:Array.isArray(value?.items)?value.items:Array.isArray(value?.resultados)?value.resultados:[];}
export async function byCNPJ(cnpj){const id=normalizeCnpj(cnpj);if(!validCNPJ(id))throw Error("CNPJ inválido. Confira os 14 dígitos.");
try{const data=await request(API+"/cnpj/"+id);return normalize(data,"Fichário / Receita Federal");}catch(error){try{const data=await request(OPEN_CNPJ+id);return normalize(data,"OpenCNPJ / Receita Federal");}catch{throw error;}}}
export async function byName({query,uf="SP",city=""}){const q=str(query);if(q.length<3)throw Error("Informe pelo menos 3 letras do nome da empresa.");const p=new URLSearchParams({q,uf:str(uf).toUpperCase(),...(city?{cidade:str(city)}:{})});const data=await request(API+"/busca?"+p);return {items:unwrap(data).map(x=>normalize(x,"Fichário / busca por nome")).filter(x=>x.verified),total:Number(data?.total??data?.resultados?.length??0),mode:"name"};}
export async function bySector({uf="SP",city="São Paulo",cnae="6920601",page=1}){
const p=new URLSearchParams({uf:str(uf).toUpperCase(),cidade:str(city),cnae:digits(cnae),pagina:String(page),por_pagina:"20",ordem:"capital_desc",situacao:"ativa"});if(!p.get("cnae")||p.get("cnae").length!==7)throw Error("Informe o CNAE com 7 dígitos.");
const data=await request(API+"/busca-avancada?"+p);const items=unwrap(data).map(x=>normalize(x,"Fichário / busca por setor")).filter(x=>x.verified);return {items,total:Number(data?.total||data?.total_resultados||items.length),mode:"sector",page,notice:String(data?.aviso||"")};}
export async function enrich(items,max=8){const arr=items.slice(0,max);const results=await Promise.allSettled(arr.map(x=>byCNPJ(x.cnpj)));return arr.map((x,i)=>results[i].status==="fulfilled"?{...results[i].value,source:x.source}:x);}
export async function byRadius({city="São Paulo",neighborhood="Tatuapé",radiusKm=3,sector=""}){
const km=Math.max(1,Math.min(15,Number(radiusKm)||3));
const q=[str(neighborhood),str(city),"Brasil"].filter(Boolean).join(", ");
const geo=await request("https://nominatim.openstreetmap.org/search?"+new URLSearchParams({q,format:"json",limit:"1",countrycodes:"br",addressdetails:"1"}));
const match=Array.isArray(geo)?geo[0]:null;if(!match)throw Error("Não consegui localizar essa região para aplicar o raio.");
const lat=Number(match.lat),lon=Number(match.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))throw Error("Geolocalização inválida.");
const meters=Math.round(km*1000);const query='[out:json][timeout:20];(nwr(around:'+meters+','+lat+','+lon+')["ref:BR:cnpj"];nwr(around:'+meters+','+lat+','+lon+')["cnpj"];);out center tags 35;';
const data=await request("https://overpass.kumi.systems/api/interpreter?data="+encodeURIComponent(query),{limit:26000}).catch(async()=>await request("https://overpass-api.de/api/interpreter?data="+encodeURIComponent(query),{limit:26000}));
const base=(data?.elements||[]).map(e=>{const tags=e.tags||{};const id=normalizeCnpj(tags["ref:BR:cnpj"]||tags.cnpj||"");return {cnpj:id,lat:e.lat??e.center?.lat,lon:e.lon??e.center?.lon,company_name:tags.name||tags.brand||"Empresa",sector:tags.office||tags.shop||tags.amenity||"",neighborhood:str(neighborhood),city:str(city),source:"OpenStreetMap / CNPJ publicado",sourceUrl:"https://www.openstreetmap.org/"+e.type+"/"+e.id,verified:validCNPJ(id)};}).filter(x=>x.verified);
const dedup=[...new Map(base.map(x=>[x.cnpj,x])).values()].slice(0,15);
const enriched=await enrich(dedup,Math.min(dedup.length,10));
const filtered=sector?enriched.filter(x=>[x.sector,x.company_name,x.razao_social].join(" ").toLowerCase().includes(sector.toLowerCase())):enriched;
return {items:filtered.map(x=>({...x,source:"OpenStreetMap + Fichário",radiusKm:km})),total:filtered.length,mode:"radius",center:{lat,lon},notice:"Raio real, porém apenas estabelecimentos com CNPJ explicitamente identificado no OpenStreetMap. Resultado não exaustivo."};
}
