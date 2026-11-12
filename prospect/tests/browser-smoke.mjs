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
 console.log("BROWSER E2E PASS: login demonstrativo, sidebar, modo CNPJ, consulta real, captura e CRM.");
 ws.close();
}catch(err){console.error("BROWSER E2E FAIL",err);process.exitCode=1;}finally{finish();}
