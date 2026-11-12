import assert from "node:assert/strict";
import { spawn, execSync } from "node:child_process";

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromePath=process.env.CHROME_BIN||execSync("command -v google-chrome || command -v chromium",{encoding:"utf8"}).trim();
const server=spawn("python3",["-m","http.server","8123","--bind","127.0.0.1"],{stdio:"ignore"});
const chrome=spawn(chromePath,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--remote-allow-origins=*","--remote-debugging-port=9222","--user-data-dir=/tmp/gelz-prospect-cdp-"+process.pid,"http://127.0.0.1:8123/prospect/"],{stdio:"ignore"});
const finish=()=>{chrome.kill("SIGTERM");server.kill("SIGTERM");};
process.on("exit",finish);
try{
 let endpoint;for(let i=0;i<60;i++){try{const json=await (await fetch("http://127.0.0.1:9222/json/list")).json();endpoint=json.find(x=>x.type==="page")?.webSocketDebuggerUrl;if(endpoint)break;}catch{}await delay(300);}
 assert.ok(endpoint,"Chrome DevTools unavailable");
 const ws=new WebSocket(endpoint);await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
 let n=0;const waiting=new Map();
 ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id&&waiting.has(m.id)){const {resolve,reject}=waiting.get(m.id);waiting.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++n;waiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async code=>{const r=await call("Runtime.evaluate",{expression:code,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+" "+r.exceptionDetails.exception?.description);return r.result?.value;};
 const waitFor=async (code,attempts=80)=>{for(let i=0;i<attempts;i++){const v=await evaluate(code);if(v)return v;await delay(280);}throw Error("Timeout waiting for "+code);};
 await call("Runtime.enable");
 await waitFor("!!document.querySelector('#demo-button') && !document.querySelector('#setup-panel').classList.contains('hidden')");
 await evaluate("document.querySelector('#demo-button').click()");
 await waitFor("!document.querySelector('#workspace').classList.contains('hidden')");
 assert.equal(await evaluate("!!document.querySelector('#capture-form')"),true,"CNPJ capture on home");
 await waitFor("!document.querySelector('.loading-stripes')",125);
 await evaluate("document.querySelector('[data-view=leads]').click()");
 assert.equal(await waitFor("document.querySelector('#current-breadcrumb').textContent==='Meus leads'"),true,"Sidebar navigation to Leads");
 await evaluate("document.querySelector('[data-view=discover]').click()");
 assert.equal(await waitFor("document.querySelector('#current-breadcrumb').textContent==='Capturar CNPJs'"),true,"Sidebar navigation to CNPJ capture");
 await evaluate("const s=document.querySelector('#capture-mode');s.value='cnpj';s.dispatchEvent(new Event('change',{bubbles:true}));true");
 assert.equal(await evaluate("document.querySelector('[data-capture-field=cnpj]').style.display!=='none'"),true,"CNPJ input visible");
 await evaluate("document.querySelector('input[name=cnpj]').value='07396951000170';document.querySelector('#capture-form').requestSubmit();true");
 await waitFor("document.querySelector('.prospect-results .result-name') && !document.querySelector('.loading-stripes')",115);
 const result=await evaluate("document.querySelector('.prospect-results .result-name').textContent");
 assert.ok(result&&result.length>2,"Real CNPJ API returned company: "+result);
 await evaluate("document.querySelector('[data-action=capture-save]').click()");
 await waitFor("document.querySelector('#nav-lead-count').textContent==='1'");
 await evaluate("document.querySelector('[data-view=leads]').click()");
 assert.equal(await evaluate("!!document.querySelector('.data-table .cell-name')"),true,"Captured CNPJ appears in CRM");

 // WhatsApp is a direct, one-click manual link; no opt-in form lock.
 await evaluate("document.querySelector('.data-table .cell-name').click()");
 await waitFor("!!document.querySelector('#modal [data-action=lead-edit]')");
 await evaluate("document.querySelector('#modal [data-action=lead-edit]').click()");
 await waitFor("!!document.querySelector('#lead-form')");
 await evaluate("document.querySelector('#lead-form [name=contact_phone]').value='551198808780';document.querySelector('#lead-form').requestSubmit();true");
 await waitFor("!!document.querySelector('#main .data-table [data-action=wa-direct]')");
 console.log("WA DOM PRE",await evaluate("JSON.stringify({view:document.querySelector('#current-breadcrumb')?.textContent,phone:document.querySelector('#main .data-table .cell-meta')?.textContent,waButtons:document.querySelectorAll('[data-action=wa-direct]').length,mainText:document.querySelector('#main')?.innerText.slice(0,700)})"));
 await waitFor("(()=>{const el=document.querySelector('#main .data-table [data-action=wa-direct]');if(!el)return false;window.__gelzWaUrl='';window.open=(url)=>{window.__gelzWaUrl=String(url);return {};};el.click();return true;})()",60);
 await waitFor("window.__gelzWaUrl.startsWith('https://wa.me/551198808780?text=')");
 assert.ok((await evaluate("decodeURIComponent(window.__gelzWaUrl)")).includes("Olá!"),"WhatsApp message present");
 await evaluate("document.querySelector('.data-table .cell-name').click();document.querySelector('#modal [data-action=wa-compose]').click()");
 await waitFor("!!document.querySelector('#wa-form')");
 assert.equal(await evaluate("document.querySelector('#wa-form button[type=submit]').disabled"),false,"Editable WhatsApp not blocked by opt-in");
 await evaluate("document.querySelector('#modal-close').click()");


 await evaluate("document.querySelector('[data-view=discover]').click()");
 await evaluate("const el=document.querySelector('#capture-mode');el.value='sector';el.dispatchEvent(new Event('change',{bubbles:true}));true");
 assert.equal(await evaluate("!!document.querySelector('select[name=porte]') && !!document.querySelector('select[name=capitalBand]') && !!document.querySelector('input[name=bairro]')"),true,"Neighborhood and capital filter controls");
 await evaluate("document.querySelector('select[name=cnae]').value='';document.querySelector('select[name=porte]').value='ME';document.querySelector('select[name=capitalBand]').value='under50k';document.querySelector('select[name=order]').value='razao_asc';document.querySelector('#capture-form').requestSubmit();true");
 await waitFor("document.querySelector('.capture-pagination') && !document.querySelector('.loading-stripes')",125);
 const count1=await evaluate("document.querySelectorAll('.prospect-results tbody tr').length");
 assert.ok(count1>0&&count1<=20,"real source returns one page of up to 20 small companies");

 await evaluate("window.confirm=()=>true;document.querySelector('[data-action=capture-bulk]').click();true");
 await waitFor("Number(document.querySelector('#nav-lead-count').textContent)>1");

 assert.equal(await evaluate("document.querySelector('.capture-page-caption').textContent.includes('Página')"),true);
 const firstPage=await evaluate("document.querySelector('.capture-page-caption').textContent");
 assert.ok(firstPage.includes('1'),"first page shown");
 await evaluate("window.__gelzOriginalFetch=window.fetch;window.fetch=(input,options)=>{const url=String(input);if(url.includes('/busca-avancada') && url.includes('pagina=2'))return Promise.resolve(new Response(JSON.stringify({total_numero:40,paginas:2,pagina:2,resultados:[{cnpj:'07396951000170',nome_fantasia:'EMPRESA TESTE SOMENTE EM CI',razao_social:'EMPRESA TESTE',municipio:'SAO PAULO',uf:'SP',porte:'ME',capital_social:35000}]}),{status:200,headers:{'content-type':'application/json'}}));return window.__gelzOriginalFetch(input,options);};true");
 await evaluate("document.querySelector('[data-action=capture-page-next]').click()");
 await waitFor("document.querySelector('.capture-page-caption') && document.querySelector('.capture-page-caption').textContent.includes('Página 2') && !document.querySelector('.loading-stripes')",125);
 const count2=await evaluate("document.querySelectorAll('.prospect-results tbody tr').length");

 console.log("PAGINATION E2E: fixture validates page 2 transition; live CNPJ query remains separately tested.");
 assert.ok(count2>0,"next page contains business listings");

 await evaluate("window.fetch=window.__gelzOriginalFetch;true");
 await evaluate("const mode=document.querySelector('#capture-mode');mode.value='cnpj';mode.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('input[name=cnpj]').value='19131243000197';document.querySelector('#capture-form').requestSubmit();true");
 await waitFor("document.querySelector('[data-action=capture-partners]') && !document.querySelector('.loading-stripes')",125);
 await evaluate("document.querySelector('[data-action=capture-partners]').click()");
 await waitFor("document.querySelector('.partner-section-head') && !document.querySelector('#modal-body .loading-stripes')",95);
 assert.equal(await evaluate("document.querySelector('#modal-body').textContent.includes('Sócios')"),true,"QSA panel in browser");
 console.log("BROWSER E2E PASS: login demo, navigation, live CNPJ, company capture, direct WhatsApp, batch CRM, SME paging and QSA.");
 ws.close();
}catch(err){console.error("BROWSER E2E FAIL",err);process.exitCode=1;}finally{finish();}
