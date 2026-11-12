import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as RESEARCH from "../assets/research.js";

test("Sócio tem pesquisa LinkedIn com nome/empresa, não uma URL de perfil inventada",()=>{
 const link=RESEARCH.linkedInSearch("Sócia de Exemplo","Empresa Comercial");
 assert.match(link,/^https:\/\/www\.linkedin\.com\/search\/results\/people\/\?keywords=/);
 assert.ok(decodeURIComponent(link).includes("Sócia de Exemplo Empresa Comercial"));
 assert.equal(RESEARCH.cleanVerifiedLinkedIn("https://www.linkedin.com/in/profissional-verificado"),"https://www.linkedin.com/in/profissional-verificado/");
 assert.equal(RESEARCH.cleanVerifiedLinkedIn("https://evil.example.com/in/pessoa"),"");
 assert.equal(RESEARCH.cleanVerifiedLinkedIn("https://linkedin.com/search/results/people?keywords=x"),"");
});
test("Contato comercial em WhatsApp tem apenas DDI 55 e algarismos",()=>{
 assert.equal(RESEARCH.bareWhatsAppLink("(11) 98808-7800"),"https://wa.me/5511988087800");
 assert.equal(RESEARCH.bareWhatsAppNumber("+55 (11) 98808-7800"),"5511988087800");
 assert.equal(RESEARCH.bareWhatsAppLink("000"),"");
});
test("Dossiê cadastral usa consultas reais e não inventa telefone pessoal ou rendimento",async()=>{
 const lookup=async()=>({cnpj:"19131243000197",company_name:"Empresa Ltda",razao_social:"Empresa Ltda",porte:"EPP",capital_social:80000,sector:"Contabilidade",city:"São Paulo",phone:"11988887777",source:"Fonte cadastral",sourceUrl:"https://fichario.app/cnpj/19131243000197"});
 const owners=async()=>({partners:[{name:"Responsável Exemplo",role:"Sócio"}],corporatePhone:"1133334444",corporateEmail:"contato@empresa.com.br"});
 const d=await RESEARCH.buildPublicDossier({cnpj:"19131243000197"},{lookup,owners});
 assert.equal(d.mode,"public");
 assert.equal(d.company.cnpj,"19131243000197");
 assert.deepEqual(d.partners,[{name:"Responsável Exemplo",role:"Sócio"}]);
 assert.equal(d.company.phone,"5511988887777");
 assert.equal(d.sources.length,2);
 assert.equal(d.score>0,true);
 assert.ok(d.missing_data.some(x=>/Faturamento/i.test(x)));
 assert.ok(!JSON.stringify(d).includes("pessoal"));
});
test("UI registra interface de pesquisa web e exige backend para IA real",()=>{
 const app=readFileSync(new URL("../assets/app.js",import.meta.url),"utf8");
 const capture=readFileSync(new URL("../assets/capture.js",import.meta.url),"utf8");
 const fn=readFileSync(new URL("../supabase/functions/prospect-analyze/index.ts",import.meta.url),"utf8");
 assert.ok(app.includes("RESEARCH.buildPublicDossier"));
 assert.ok(app.includes('mode:"web_ai"'));
 assert.ok(app.includes("sources:[...dossier.sources,...normalizedSources]"));
 assert.ok(capture.includes('name==="capture-analyze"'));
 assert.ok(capture.includes("RESEARCH.linkedInSearch"));
 assert.ok(capture.includes("bareWhatsAppLink"));
 assert.ok(fn.includes("https://api.openai.com/v1/responses"));
 assert.ok(fn.includes('type":"web_search"'));
 assert.ok(fn.includes('url_citation'));
 assert.ok(fn.includes("OPENAI_API_KEY"));
 assert.ok(!fn.includes("telefone pessoal de sócio")); 
});
