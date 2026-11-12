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
