/* Pesquisa verificável para prospecção PJ. LinkedIn não disponibiliza
   pesquisa de terceiros via API aberta; apontamos à busca oficial sem fabricar URLs.
   Nenhum número pessoal é coletado, deduzido ou associado a um sócio. */
import * as Registry from "./cnpj-engine.js";
import {normalizeBrazilPhone} from "./contact-utils.js";

export function linkedInSearch(name,company=""){
  const query=[String(name||"").trim(),String(company||"").trim()].filter(Boolean).join(" ");
  return "https://www.linkedin.com/search/results/people/?keywords="+encodeURIComponent(query);
}
export function publicProfessionalSearch(name,company=""){
  const query=[String(name||"").trim(),String(company||"").trim(),"site:linkedin.com/in"].filter(Boolean).join(" ");
  return "https://www.google.com/search?q="+encodeURIComponent(query);
}
export function cleanVerifiedLinkedIn(uri){
  try{
    const u=new URL(String(uri||"").trim());
    if(u.protocol!=="https:"||!["www.linkedin.com","linkedin.com","br.linkedin.com"].includes(u.hostname)||!/^\/(in|pub)\/[^/\s]+/.test(u.pathname))return "";
    return u.origin+u.pathname.replace(/\/$/,"")+"/";
  }catch{return "";}
}
export function bareWhatsAppNumber(phone){return normalizeBrazilPhone(phone)||"";}
export function bareWhatsAppLink(phone){const number=bareWhatsAppNumber(phone);return number?"https://wa.me/"+number:"";}
function safePublicWebsite(s){try{const u=new URL(String(s||""));return u.protocol==="https:"?u.toString():"";}catch{return "";}}
export async function buildPublicDossier(lead,{lookup=Registry.byCNPJ,owners=Registry.partners}={}){
 const cnpj=String(lead?.cnpj||"").replace(/\D/g,"");
 if(!Registry.validCNPJ(cnpj))throw Error("Cadastre um CNPJ válido para consultar a empresa.");
 const [companyResult,ownersResult]=await Promise.allSettled([lookup(cnpj),owners(cnpj)]);
 if(companyResult.status!=="fulfilled"&&ownersResult.status!=="fulfilled")throw Error("As fontes públicas não responderam. Verifique conexão e tente novamente.");
 const company=companyResult.status==="fulfilled"?companyResult.value:{company_name:lead.company_name||"Empresa",cnpj,source:"CRM",sourceUrl:""};
 const partnerData=ownersResult.status==="fulfilled"?ownersResult.value:{partners:[],corporatePhone:"",corporateEmail:""};
 const contactsHidden=!!company.contactHidden;
 const partners=(partnerData.partners||[]).map(p=>({name:String(p.name||"").slice(0,150),role:String(p.role||"").slice(0,100)})).filter(x=>x.name);
 const phone=contactsHidden?"":(company.phone||partnerData.corporatePhone||lead.contact_phone||"");
 const email=contactsHidden?"":(company.email||partnerData.corporateEmail||lead.contact_email||"");
 const site=safePublicWebsite(company.site||lead.website||"");
 const score=Registry.xpFit(company);
 const sources=[
   {title:"Dados cadastrais CNPJ",url:"https://fichario.app/cnpj/"+cnpj,status:companyResult.status==="fulfilled"?"consultado":"indisponível"},
   {title:"Quadro societário (Receita / BrasilAPI)",url:"https://brasilapi.com.br/docs#tag/CNPJ",status:ownersResult.status==="fulfilled"?"consultado":"indisponível"}
 ];
 const missing=[];
 if(!company.sector)missing.push("CNAE e atividade não confirmados");
 if(!company.porte)missing.push("Porte empresarial não informado");
 if(!company.capital_social)missing.push("Capital social não informado ou declarado em zero");
 if(!phone)missing.push("Telefone comercial não identificado");
 if(!partners.length)missing.push("Responsáveis não identificados no QSA");
 missing.push("Faturamento, investimentos e liquidez não são informados pelo CNPJ");
 const features=[company.porte&&"Porte: "+company.porte,company.sector&&"Atividade: "+company.sector,company.openingDate&&"Abertura: "+company.openingDate,company.capital_social&&"Capital social declarado: R$ "+Number(company.capital_social).toLocaleString("pt-BR"),phone&&"Contato comercial registrado"].filter(Boolean);
 const opportunity=company.sector?[
   "Entender necessidades de conta PJ e operação financeira",
   "Conversar sobre organização de caixa e objetivos empresariais",
   "Verificar interesse em atendimento consultivo, sem pressupor patrimônio"
 ]:["Confirmar a atividade da empresa e o responsável pelo contato","Verificar demandas empresariais antes de oferecer soluções"];
 const summary=[company.company_name||lead.company_name||"Empresa",company.sector?("atua no setor "+company.sector):"tem atividade econômica ainda não confirmada",company.city?("em "+company.city):""].filter(Boolean).join(" ")+". Cadastro consultado em fontes públicas; sinais comerciais são apenas indicativos.";
 return {
   type:"public_registry",mode:"public",score:score.score,confidence:companyResult.status==="fulfilled"?"moderada":"baixa",
   summary,opportunities:opportunity,factors:[...features,...(score.evidence?[score.evidence]:[])],
   missing_data:missing,next_action:partners.length?"Pesquisar o contato comercial responsável e preparar uma abordagem individual.":"Verificar responsável pela empresa e contato profissional.",
   company:{
     name:company.company_name||lead.company_name||"",legalName:company.razao_social||"",
     cnpj,sector:company.sector||"",cnae:company.cnae||"",status:company.situacao||"",
     porte:company.porte||"",capitalSocial:Number(company.capital_social)||null,
     city:company.city||lead.city||"",neighborhood:company.neighborhood||lead.neighborhood||"",
     openingDate:company.openingDate||"",legalNature:company.legalNature||"",
     website:site,phone:bareWhatsAppNumber(phone),email:String(email||"").slice(0,180)
   },
   partners, sources, checkedAt:new Date().toISOString(),
   webSearches:{
      company:"https://www.google.com/search?q="+encodeURIComponent('"'+(company.razao_social||company.company_name||lead.company_name||"")+'" '+cnpj),
      news:"https://www.google.com/search?q="+encodeURIComponent('"'+(company.razao_social||company.company_name||lead.company_name||"")+'" notícias'),
      website:site
   }
 };
}
