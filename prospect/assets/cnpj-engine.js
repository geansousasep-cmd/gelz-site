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
const contactHidden=d.contato_oculto===true||d.contato_oculto==="true";
if(contactHidden)phone="";
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
phone,contactHidden,email:contactHidden?"":textField(d,"email","email_comercial","correio_eletronico"),site:textField(d,"site","website","websiteURI"),
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

export async function bySector({uf="SP",city="São Paulo",cnae="",page=1,porte="",capitalMin=null,capitalMax=null,order="capital_desc"}={}){
const pageNum=Math.max(1,Math.min(50,Math.floor(Number(page)||1)));
const capitalLower=capitalMin==null||capitalMin===""?null:Math.max(0,Number(capitalMin));
const capitalUpper=capitalMax==null||capitalMax===""?null:Math.max(0,Number(capitalMax));
const cnaeValue=digits(cnae);
if(cnaeValue&&cnaeValue.length!==7)throw Error("Informe um CNAE válido com 7 dígitos.");
if(!str(uf)||(!str(city)&&!cnaeValue))throw Error("Informe a cidade ou o CNAE e a UF.");
const validPorte=["","ME","EPP","Demais","ME,EPP"];
if(!validPorte.includes(porte))throw Error("Porte inválido.");
if(capitalLower!=null&&capitalUpper!=null&&capitalLower>capitalUpper)throw Error("Capital mínimo não pode exceder o máximo.");
const orderValues=["capital_desc","capital_asc","razao_asc"];
if(!orderValues.includes(order))order="capital_desc";
const p=new URLSearchParams({uf:str(uf).toUpperCase(),pagina:String(pageNum),por_pagina:"20",ordem:order,situacao:"ativa"});
if(str(city))p.set("cidade",str(city));if(cnaeValue)p.set("cnae",cnaeValue);if(porte)p.set("porte",porte);
if(capitalLower!=null)p.set("capital_min",String(capitalLower));
if(capitalUpper!=null)p.set("capital_max",String(capitalUpper));
const data=await request(API+"/busca-avancada?"+p);
const items=unwrap(data).map(x=>normalize(x,"Fichário / busca avançada")).filter(x=>x.verified);
const rawTotal=data?.total_numero??data?.total??data?.total_resultados??items.length;
const total=Number(String(rawTotal).replace(/[^\d]/g,""))||0;
const pages=Math.min(50,Math.max(1,Number(data?.paginas)||Math.ceil(Math.min(total,10000)/20)||1));
return {items,total,pages,mode:"sector",page:pageNum,notice:String(data?.aviso||data?.nota||""),source:"Fichário"};
}
const companyCache=new Map();
export async function enrich(items,max=8){
const selected=items.slice(0,Math.max(0,Math.min(20,Number(max)||0)));
const results=Array(selected.length);
for(let i=0;i<selected.length;i+=4){
await Promise.all(selected.slice(i,i+4).map(async(x,offset)=>{
const key=x.cnpj;
if(companyCache.has(key)){results[i+offset]=companyCache.get(key);return;}
try{const detail=await byCNPJ(key);companyCache.set(key,detail);results[i+offset]=detail;}
catch{results[i+offset]=null;}
}));
}
return items.map((x,i)=>i<selected.length&&results[i]?{...x,...results[i],source:x.source,sourceUrl:x.sourceUrl||results[i].sourceUrl}:x);
}
/* Consulta por CNPJ em fonte secundária para mostrar SOMENTE nomes e qualificações do QSA.
   O telefone exibido permanece o canal comercial oficial da empresa; documentos pessoais
   e números particulares não são extraídos nem armazenados. */
export async function partners(cnpj){
const id=normalizeCnpj(cnpj);
if(!validCNPJ(id))throw Error("CNPJ inválido.");
const data=await request("https://brasilapi.com.br/api/cnpj/v1/"+id,{limit:16000});
const socios=Array.isArray(data?.qsa)?data.qsa:[];
const persons=socios
  .map(s=>({name:str(s?.nome_socio||s?.nome||"").slice(0,160),role:str(s?.qualificacao_socio||s?.qualificacao||"Sócio / Administrador").slice(0,90)}))
  .filter(s=>s.name)
  .slice(0,25);
const ownerProtected=String(data?.natureza_juridica||"").toLowerCase().includes("empresário individual")||data?.opcao_pelo_mei===true;
let corporatePhone=ownerProtected?"":str(data?.ddd_telefone_1||"").replace(/\D/g,"");
let corporateEmail=ownerProtected?"":str(data?.email||"").slice(0,200);
return {partners:persons,corporatePhone,corporateEmail,source:"BrasilAPI / dados cadastrais públicos da Receita Federal",sourceUrl:"https://brasilapi.com.br/docs#tag/CNPJ",retrievedAt:new Date().toISOString()};
}
export async function geocodeCenter({city="São Paulo",neighborhood="Tatuapé"}){
const q=[str(neighborhood),str(city),"Brasil"].filter(Boolean).join(", ");
const data=await request("https://nominatim.openstreetmap.org/search?"+new URLSearchParams({q,format:"json",limit:"1",countrycodes:"br",addressdetails:"1"}));
const match=Array.isArray(data)?data[0]:null;if(!match)throw Error("Região não localizada. Confira bairro e cidade.");
const latitude=Number(match.lat),longitude=Number(match.lon);
if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw Error("Coordenadas não disponíveis.");
return {latitude,longitude};
}
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
