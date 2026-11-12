Deno.serve(async function analysisHandler(req){
const requestOrigin=req.headers.get("origin")||"";
const allowed=["https://gelz.tech","https://www.gelz.tech","http://localhost:5173","http://localhost:8000","http://127.0.0.1:8000"];
const origin=allowed.includes(requestOrigin)?requestOrigin:"https://gelz.tech";
const headers={"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, x-client-info, content-type","content-type":"application/json","vary":"Origin"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
if(req.method!=="POST")return json({error:"Método não permitido"},405);
if(requestOrigin&&!allowed.includes(requestOrigin))return json({error:"Origem não autorizada"},403);
const sbUrl=Deno.env.get("SUPABASE_URL"),sbKey=Deno.env.get("SUPABASE_ANON_KEY"),apiKey=Deno.env.get("OPENAI_API_KEY");
const bearer=req.headers.get("authorization")||"";
if(!sbUrl||!sbKey||!apiKey)return json({error:"Serviço de IA não configurado"},503);
if(!bearer.startsWith("Bearer "))return json({error:"Autenticação ausente"},401);
const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2");
const sb=createClient(sbUrl,sbKey,{global:{headers:{Authorization:bearer}}});
const {data:{user},error:authError}=await sb.auth.getUser(bearer.slice(7));
if(!user||authError)return json({error:"Não autenticado"},401);
const {data:admin}=await sb.from("prospect_admins").select("must_change_password").eq("id",user.id).eq("username","admin").maybeSingle();
if(!admin||admin.must_change_password)return json({error:"Acesso não autorizado"},403);
let data;try{data=await req.json()}catch{return json({error:"JSON inválido"},400);}
const l=data.lead;
if(!l||typeof l!=="object")return json({error:"Lead ausente"},400);
// Nunca transmitir telefone, email, nome do contato ou notas pessoais ao modelo.
const business={
  company_name:String(l.company_name||"").slice(0,180),
  sector:String(l.sector||"").slice(0,80),
  cnae:String(l.cnae||"").slice(0,120),
  city:String(l.city||"").slice(0,90),
  neighborhood:String(l.neighborhood||"").slice(0,90),
  cnpj_verified:!!l.cnpj_verified,
  data_origin:String(l.source_type||"").slice(0,80),
  cnpj_presence:!!l.cnpj
};
const evidences=[business.sector,business.cnae,business.city,business.cnpj_verified?"CNPJ validado":""].filter(Boolean);
if(evidences.length<2)return json({analysis:{score:null,summary:"Dados empresariais insuficientes para calcular potencial comercial.",confidence:"insuficiente",opportunities:[],factors:[],missing_data:["Segmento ou CNAE","Localização","Dados cadastrais verificáveis"],next_action:"Verificar informações da empresa antes de analisar.",sources:[]}});
const system=`Você é um analista de prospecção B2B responsável em instituição financeira brasileira.
Produza exclusivamente JSON válido. Sua tarefa é avaliar aderência COMERCIAL a uma conversa inicial sobre soluções de conta PJ, gestão de caixa, serviços bancários empresariais e relacionamento.
Não avalie capacidade financeira real, faturamento, lucro, patrimônio, saldo, capital disponível, perfil de risco individual ou suitability. Nunca crie números financeiros.
Apenas use fatos explícitos do objeto fornecido. Se informações insuficientes para pontuar, score deve ser null. Indique sempre os dados faltantes.
Não use proxies pessoais, sensíveis ou demográficos. Não invente links, fontes externas ou fatos. Se não houver URL original, liste apenas "Informações fornecidas no CRM" como fonte.
Não apresente recomendações de investimentos específicos ou promessa de rentabilidade.
Formato JSON obrigatório: {"score":number|null,"summary":string,"confidence":"baixa"|"moderada"|"alta"|"insuficiente","opportunities":string[],"factors":string[],"missing_data":string[],"next_action":string,"sources":string[]}.
Pontuação 0-100 quando sustentada, transparente, de oportunidade comercial e NÃO de renda/patrimônio.`;
try{
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
let res;try{res=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",signal:controller.signal,headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},body:JSON.stringify({model:Deno.env.get("OPENAI_MODEL")||"gpt-4.1-mini",temperature:0.15,response_format:{type:"json_object"},max_completion_tokens:650,messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(business)}]})});}finally{clearTimeout(timeout);}
if(!res.ok){console.error("AI response",res.status);return json({error:"Serviço de IA indisponível. Verifique credenciais e quota."},502);}
const answer=await res.json();
const content=answer.choices?.[0]?.message?.content;
if(!content)return json({error:"Resposta vazia do modelo"},502);
const a=JSON.parse(content);
const score=a.score===null||a.score===undefined?null:Math.max(0,Math.min(100,Math.round(Number(a.score))));
const analysis={score:Number.isFinite(score)?score:null,summary:String(a.summary||"").slice(0,1400),confidence:["baixa","moderada","alta","insuficiente"].includes(a.confidence)?a.confidence:"insuficiente",opportunities:(Array.isArray(a.opportunities)?a.opportunities:[]).slice(0,6).map(x=>String(x).slice(0,200)),factors:(Array.isArray(a.factors)?a.factors:[]).slice(0,6).map(x=>String(x).slice(0,200)),missing_data:(Array.isArray(a.missing_data)?a.missing_data:[]).slice(0,6).map(x=>String(x).slice(0,200)),next_action:String(a.next_action||"").slice(0,500),sources:["Informações fornecidas no CRM"]};
return json({analysis,generatedAt:new Date().toISOString(),note:"Potencial comercial, não capacidade financeira."});
}catch(err){console.error("prospect-analyze",String(err));return json({error:"Não foi possível finalizar a análise."},502);}
});