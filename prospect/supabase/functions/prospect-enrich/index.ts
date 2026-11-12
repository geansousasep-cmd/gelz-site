Deno.serve(async function enrichmentHandler(req){
const corsOrigin=req.headers.get("origin")||"";
const allowed=["https://gelz.tech","https://www.gelz.tech","http://localhost:5173","http://localhost:8000","http://127.0.0.1:8000"];
const origin=allowed.includes(corsOrigin)?corsOrigin:"https://gelz.tech";
const headers={"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, x-client-info, content-type","content-type":"application/json","vary":"Origin"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
if(req.method!=="POST")return json({error:"Método não permitido"},405);
if(corsOrigin&&!allowed.includes(corsOrigin))return json({error:"Origem não permitida"},403);
const sbUrl=Deno.env.get("SUPABASE_URL"),sbKey=Deno.env.get("SUPABASE_ANON_KEY");
const bearer=req.headers.get("authorization")||"";
if(!sbUrl||!sbKey||!bearer.startsWith("Bearer "))return json({error:"Integração ou autenticação ausente"},401);
const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2");
const sb=createClient(sbUrl,sbKey,{global:{headers:{Authorization:bearer}}});
const {data:{user},error:authError}=await sb.auth.getUser(bearer.substring(7));
if(authError||!user)return json({error:"Não autenticado"},401);
const {data:admin,error:adminError}=await sb.from("prospect_admins").select("must_change_password").eq("id",user.id).eq("username","admin").maybeSingle();
if(adminError||!admin||admin.must_change_password)return json({error:"Acesso negado ao enriquecimento"},403);
let input;try{input=await req.json()}catch{return json({error:"JSON inválido"},400);}
const mode=String(input.mode||"");
function isCnpjValid(inputCnpj){
const c=String(inputCnpj||"").replace(/\D/g,"");if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;
function digit(n){const offset=n===12?5:6;let sum=0;for(let i=0;i<n;i++)sum+=Number(c[i])*(offset-i>1?offset-i:offset-i+8);const d=sum%11;return d<2?0:11-d;}
return digit(12)===Number(c[12])&&digit(13)===Number(c[13]);}
try{
if(mode==="cnpj"){
const cnpj=String(input.cnpj||"").replace(/\D/g,"");
if(!isCnpjValid(cnpj))return json({error:"CNPJ inválido"},422);
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
let res;try{res=await fetch("https://brasilapi.com.br/api/cnpj/v1/"+cnpj,{signal:controller.signal,headers:{accept:"application/json"}})}finally{clearTimeout(timer);}
if(!res.ok)return json({error:"Consulta cadastral indisponível ou CNPJ não encontrado"},res.status===404?404:502);
const d=await res.json();
return json({company:{cnpj,razao_social:String(d.razao_social||""),nome:String(d.nome_fantasia||""),cnae_fiscal_descricao:String(d.cnae_fiscal_descricao||""),municipio:String(d.municipio||""),uf:String(d.uf||""),situacao_cadastral:String(d.descricao_situacao_cadastral||"")},source:"BrasilAPI / CNPJ",retrievedAt:new Date().toISOString()});
}

if(mode==="radius"){
const secret=Deno.env.get("PROSPECT_RADIUS_API_KEY");
if(!secret)return json({error:"Busca completa por raio requer ativação de fornecedor geográfico e token no servidor."},503);
const latitude=Number(input.latitude),longitude=Number(input.longitude);
const radiusKm=Number(input.radiusKm)||3;
const cnae=String(input.cnae||"").replace(/\D/g,"");
if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-35||latitude>7||longitude<-75||longitude>-28||radiusKm<1||radiusKm>25)return json({error:"Coordenadas ou raio inválidos"},422);
if(cnae&&cnae.length!==7)return json({error:"CNAE inválido"},422);
const payload={latitude,longitude,raio_km:radiusKm,page:1,page_size:30,...(cnae?{cnae}:{})};
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),16000);
let response;try{response=await fetch("https://api.apicnpjs.com.br/v1/cnpj/search/location",{method:"POST",signal:controller.signal,headers:{"authorization":"Bearer "+secret,"content-type":"application/json","accept":"application/json"},body:JSON.stringify(payload)});}finally{clearTimeout(timer);}
if(!response.ok)return json({error:"Fornecedor de geolocalização não respondeu corretamente ("+response.status+")."},response.status===401?503:502);
const result=await response.json();
const entries=Array.isArray(result?.data)?result.data:Array.isArray(result?.resultados)?result.resultados:Array.isArray(result?.empresas)?result.empresas:Array.isArray(result?.items)?result.items:Array.isArray(result)?result:[];
const items=entries.slice(0,30).map(x=>{
const d=x?.empresa||x||{};
const address=d.endereco||{};
return {
cnpj:String(d.cnpj||d.documento||"").replace(/\D/g,"").slice(0,14),
razao_social:String(d.razao_social||d.razaoSocial||d.nome_empresarial||"").slice(0,180),
nome_fantasia:String(d.nome_fantasia||d.nomeFantasia||"").slice(0,180),
municipio:String(d.municipio||d.cidade||address.municipio||"").slice(0,80),
uf:String(d.uf||address.uf||"").slice(0,2),
bairro:String(d.bairro||address.bairro||"").slice(0,110),
porte:String(d.porte||d.porte_empresa||"").slice(0,80),
capital_social:d.capital_social||d.capitalSocial||null,
telefone:String(d.telefone_comercial||d.telefone||"").slice(0,35),
atividade_principal:typeof d.atividade_principal==="object"?{codigo:String(d.atividade_principal.codigo||""),descricao:String(d.atividade_principal.descricao||"")}:undefined,
cnae_fiscal_descricao:String(d.cnae_fiscal_descricao||"").slice(0,150),
distancia_km:Number(d.distancia_km||d.distancia||0)||null
};}).filter(x=>x.cnpj.length===14);
return json({items,total:Number(result?.total||entries.length),source:"API CNPJs / busca geográfica",retrievedAt:new Date().toISOString(),radiusKm});
}
if(mode==="search"||mode==="contacts"){
const envName=mode==="search"?"PROSPECT_CNPJ_SEARCH_ENDPOINT":"PROSPECT_CONTACT_ENDPOINT";
const tokenName=mode==="search"?"PROSPECT_CNPJ_PROVIDER_KEY":"PROSPECT_CONTACT_PROVIDER_KEY";
const endpoint=Deno.env.get(envName),token=Deno.env.get(tokenName);
if(!endpoint||!token)return json({error:"Fornecedor autorizado não configurado para "+(mode==="search"?"busca de CNPJ por nome":"contatos comerciais")},503);
const url=new URL(endpoint);
if(url.protocol!=="https:")return json({error:"Endpoint do fornecedor deve usar HTTPS"},500);
const payload={companyName:String(input.companyName||"").slice(0,180),city:String(input.city||"").slice(0,80),cnpj:String(input.cnpj||"").replace(/\D/g,"").slice(0,14)};
if(!payload.companyName&&!payload.cnpj)return json({error:"Empresa ou CNPJ obrigatório"},400);
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
let response;try{response=await fetch(url.toString(),{method:"POST",headers:{"authorization":"Bearer "+token,"content-type":"application/json"},body:JSON.stringify(payload),signal:controller.signal})}finally{clearTimeout(timer);}
if(!response.ok)return json({error:"Fornecedor indisponível: "+response.status},502);
const d=await response.json();
if(mode==="search"){
const candidates=Array.isArray(d.candidates)?d.candidates:[];
return json({candidates:candidates.slice(0,15).filter(x=>x&&typeof x==="object").map(x=>({cnpj:String(x.cnpj||""),razao_social:String(x.razao_social||""),nome:String(x.nome||""),municipio:String(x.municipio||""),uf:String(x.uf||""),source:String(x.source||url.hostname)})),source:url.hostname});
}
const contacts=Array.isArray(d.contacts)?d.contacts:[];
return json({contacts:contacts.filter(x=>x?.contactType==="commercial"&&x?.source).slice(0,10).map(x=>({value:String(x.value||""),contactType:"commercial",channel:String(x.channel||""),source:String(x.source||""),retrievedAt:new Date().toISOString()})),source:url.hostname});
}
return json({error:"Modo não suportado"},400);
}catch(err){console.error("prospect-enrich",String(err));return json({error:"Erro de integração. Consulte logs do servidor."},502);}
});