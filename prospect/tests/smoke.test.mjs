import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const get=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("App shell and local assets exist",()=>{
 const html=get("index.html");
 for(const key of ["auth-screen","login-form","rotate-form","workspace","sidebar","main","modal","command"])assert.ok(html.includes('id="'+key+'"'),key);
 for(const file of ["assets/app.css","assets/app.js","config.js","favicon.svg","supabase/schema.sql","README.md"])assert.ok(existsSync(new URL("../"+file,import.meta.url)),file);
});
test("CRM and Google Places workflows are wired to the UI",()=>{
 const js=get("assets/app.js");
 for(const k of ["storeLead","stageChange","runAI","searchPlaces","placeDetails","enrichCnpj","validWhats","openWhatsapp","commercialContacts","importCSV","downloadCSV","renderCommand"])assert.ok(js.includes(k),k);
 assert.ok(js.includes('opt_in_evidence'));
 assert.ok(js.includes("searchByText"));
});
test("Backend is protected by RLS with admin membership and password rotation",()=>{
 const sql=get("supabase/schema.sql");
 for(const table of ["prospect_admins","prospect_leads","prospect_tasks","prospect_events","prospect_preferences"])assert.match(sql,new RegExp("alter table public\\."+table+" enable row level security","i"));
 assert.ok(sql.includes("prospect_is_active_admin"));
 assert.ok(sql.includes("prospect_password_rotated"));
});
test("Browser config never includes tokens or passwords",()=>{
 const cfg=get("config.js");
 assert.ok(!/sk-[A-Za-z0-9]{10,}|service_role[^:]*:[ ]*["'][A-Za-z0-9]/.test(cfg));
 assert.ok(cfg.includes('supabaseAnonKey: ""'));
 assert.ok(cfg.includes('googleMapsKey: ""'));
});
test("Server functions require authenticated admin and bounded sources",()=>{
 const enrich=get("supabase/functions/prospect-enrich/index.ts");
 const ai=get("supabase/functions/prospect-analyze/index.ts");
 for(const code of [enrich,ai]){assert.ok(code.includes('auth.getUser'));assert.ok(code.includes("prospect_admins"));assert.ok(code.includes("must_change_password"));}
 assert.ok(enrich.includes('mode==="contacts"'));assert.ok(ai.includes("Não avalie capacidade financeira real"));
});
