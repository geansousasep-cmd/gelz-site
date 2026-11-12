import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as CNPJ from "../assets/cnpj-engine.js";
import * as CAPTURE from "../assets/capture.js";

test("CNPJ verifies check digits, rejecting invalid registrations",()=>{
 assert.equal(CNPJ.validCNPJ("07.396.951/0001-70"),true);
 assert.equal(CNPJ.validCNPJ("00.000.000/0000-00"),false);
 assert.equal(CNPJ.validCNPJ("07.396.951/0001-71"),false);
});
test("No financial numbers are invented when business record lacks porte/capital",()=>{
 assert.equal(CNPJ.potential({company_name:"Exemplo"}).score,null);
 const score=CNPJ.potential({porte:"EPP",capital_social:200000});
 assert.ok(score.score>0&&score.score<=100);
});
test("Only official CNPJ source name labels appear on discovery surface",()=>{
 const state={leads:[],tasks:[],events:[]};
 CAPTURE.setup({state,ic:()=>"<svg></svg>",render:()=>{},fmtDate:()=>"",toast:()=>{}});
 const home=CAPTURE.home(),browse=CAPTURE.discover();
 assert.ok(home.includes('id="capture-form"'));
 assert.ok(home.includes('name="mode"'));
 assert.ok(home.includes("Ranking de oportunidades"));
 assert.ok(browse.includes("CNPJ"));
 assert.ok(!home.includes("google-map"));
});
test("Navigation has a delegated [data-view] listener, and action handlers for CNPJ capture",()=>{
 const code=readFileSync(new URL("../assets/app.js",import.meta.url),"utf8");
 assert.ok(code.includes('closest("[data-view]")'),"sidebar navigation");
 assert.ok(code.includes("CAPTURE.submit(f)"),"CNPJ form");
 assert.ok(code.includes("CAPTURE.action(action,id)"),"CNPJ actions");
 assert.ok(code.includes("CAPTURE.changeMode(el.value)"),"mode switch");
});

test("Pagination and neighborhood/company-size/capital filters are present in capture UI",()=>{
  const page=CAPTURE.home();
  for(const field of ["name=\"bairro\"","name=\"porte\"","name=\"capitalBand\"","name=\"order\"","name=\"cnae\""])
    assert.ok(page.includes(field),field);
  assert.ok(page.includes("Todos os segmentos"));
});
test("Search API sends second page and small-capital/porte filters without fetching giant companies",async()=>{
  const original=globalThis.fetch;let url="";
  globalThis.fetch=async(input)=>{url=String(input);return new Response(JSON.stringify({total_numero:400,paginas:20,pagina:2,resultados:[]}),{status:200,headers:{"content-type":"application/json"}});};
  try{
    const response=await CNPJ.bySector({uf:"SP",city:"São Paulo",page:2,porte:"ME",capitalMin:0,capitalMax:50000,cnae:"",order:"capital_asc"});
    const params=new URL(url).searchParams;
    assert.equal(params.get("pagina"),"2");
    assert.equal(params.get("capital_max"),"50000");
    assert.equal(params.get("capital_min"),"0");
    assert.equal(params.get("porte"),"ME");
    assert.equal(params.get("cnae"),null);
    assert.equal(params.get("ordem"),"capital_asc");
    assert.equal(response.pages,20);
  }finally{globalThis.fetch=original;}
});
test("Owner QSA API returns business roles only without personal identifiers",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({qsa:[{nome_socio:"Representante Exemplo",qualificacao_socio:"Sócio-Administrador",cnpj_cpf_do_socio:"***1234**"}],ddd_telefone_1:"1133334444",email:"empresa@exemplo.com"}),{status:200,headers:{"content-type":"application/json"}});
  try{
    const result=await CNPJ.partners("19131243000197");
    assert.deepEqual(result.partners,[{name:"Representante Exemplo",role:"Sócio-Administrador"}]);
    assert.ok(!JSON.stringify(result).includes("1234"));
    assert.equal(result.corporatePhone,"1133334444");
  }finally{globalThis.fetch=original;}
});
