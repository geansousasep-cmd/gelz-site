(async function gelzProspectApp(){
"use strict";
const C=window.GELZ_CONFIG||{};
const CAPTURE=await import("./capture.js");
const CNPJ_API=await import("./cnpj-engine.js");
const CONTACT=await import("./contact-utils.js");
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const safe=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const attr=safe;
const title=s=>String(s||"").trim();
const fmtDate=v=>{if(!v)return "Sem data";const d=new Date(v);return isNaN(+d)?"Sem data":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});};
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>globalThis.crypto?.randomUUID?.()||"local-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const STAGES=["Descoberto","Em pesquisa","Qualificado","Aguardando autorização","Em conversa","Reunião agendada","Proposta","Convertido","Sem interesse"];
const VIEW_NAMES={dashboard:"Início",discover:"Capturar CNPJs",leads:"Meus leads",pipeline:"Funil",tasks:"Agenda",intelligence:"Inteligência",reports:"Gráficos",settings:"Ajustes"};
const paths={
dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
columns:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 19l.6 1.4L7 21l-1.4.6L5 23l-.6-1.4L3 21l1.4-.6zM19 3l.6 1.4L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.6z"/>',
chart:'<path d="M3 3v18h18M7 16l4-5 4 2 5-7"/>',
settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="m19.4 15 1.2 1.9-2.4 2.4-1.9-1.2a8 8 0 0 1-2.3 1l-.5 2.1h-3.4l-.5-2.1a8 8 0 0 1-2.3-1l-1.9 1.2L3 16.9 4.2 15a8 8 0 0 1-1-2.3L1 12.2V9l2.2-.5a8 8 0 0 1 1-2.3L3 4.3 5.4 2l1.9 1.2a8 8 0 0 1 2.3-1L10.1 0h3.4l.5 2.2a8 8 0 0 1 2.3 1L18.2 2l2.4 2.3-1.2 1.9a8 8 0 0 1 1 2.3l2.2.5v3.4l-2.2.5a8 8 0 0 1-1 2.1z" transform="translate(1 1) scale(.88)"/>',
logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
close:'<path d="M5 5l14 14M19 5 5 19"/>',
arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.2 10a16 16 0 0 0 6.8 6.8l1.6-1.9a2 2 0 0 1 1.7-.6l3 .5A2 2 0 0 1 22 16.9z"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
check:'<path d="M4 12l5 5L20 6"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',
upload:'<path d="M12 17V5m-5 5 5-5 5 5M4 18v3h16v-3"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 5 9 8 9-8"/>',
link:'<path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2"/>',
shield:'<path d="m12 2 9 4v6c0 6-4 9-9 11-5-2-9-5-9-11V6z"/><path d="m8 12 3 3 5-6"/>',
filter:'<path d="M3 5h18M6 12h12M10 19h4"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
refresh:'<path d="M20 7a9 9 0 0 0-16-2L2 8M2 3v5h5M4 17a9 9 0 0 0 16 2l2-3m0 5v-5h-5"/>',
copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
calendarPlus:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M12 13v5m-2.5-2.5h5"/>'
};
const ic=(k,size=17)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[k]||paths.info}</svg>`;
function icons(root=document){root.querySelectorAll("[data-icon]").forEach(e=>e.innerHTML=ic(e.dataset.icon));}
const state={client:null,user:null,account:null,demo:false,leads:[],tasks:[],events:[],view:"dashboard",map:null,mapElement:null,mapMarkers:[],places:[],placeSelected:null,details:null,loading:false,searchTerm:"",searchStage:"",analysisLeadId:"",settings:{},mapBusy:false};
const fakeCompanies=[
["Alvorada Contábil (fictícia)","Contabilidade","Tatuapé","Qualificado"],
["Horizonte Atacado (fictícia)","Comércio","Brás","Em pesquisa"],
["Orion Logística (fictícia)","Logística","Mooca","Descoberto"],
["Lumi Tecnologia (fictícia)","Tecnologia","Vila Mariana","Em conversa"],
["Ponto Norte Arquitetura (fictícia)","Serviços","Pinheiros","Reunião agendada"],
["Vértice Gestão (fictícia)","Consultoria","Santana","Proposta"],
["Terranova Serviços (fictícia)","Serviços","Paulista","Sem interesse"]
];
CAPTURE.setup({state,ic,render,toast,openModal,closeModal,viewLead,recordEvent,stageChange,fmtDate});
function createDemoLeads(){return fakeCompanies.map((a,i)=>({id:"fic-"+i,company_name:a[0],sector:a[1],neighborhood:a[2],city:"São Paulo",stage:a[3],contact_name:"",contact_phone:"",contact_email:"",contact_source_url:"",opt_in_whatsapp:false,opt_in_evidence:"",cnpj:"",cnpj_verified:false,cnae:"",source_type:"fictício",place_id:"",website:"",notes:"Dados exclusivamente fictícios para visualização do produto.",next_contact_at:null,created_at:new Date(Date.now()-i*86400000).toISOString(),updated_at:new Date(Date.now()-i*86400000).toISOString(),ai_score:null,ai_analysis:null}));}
function toast(message,type="ok"){const d=document.createElement("div");d.className="toast"+(type==="error"?" error":"");d.textContent=message;$("#toast-root").appendChild(d);setTimeout(()=>d.remove(),4500);}
function demoWarn(){toast("Demonstração: apenas dados fictícios e operações locais. Nenhuma integração ativa.");}
function pageHeader(eyebrow,heading,subtitle,actions=""){return `<div class="page-header"><div><div class="eyebrow">${safe(eyebrow)}</div><h1>${safe(heading)}</h1><p>${safe(subtitle)}</p></div><div class="page-actions">${actions}</div></div>`;}
function btn(text,action,variant="button-subtle",extra=""){return `<button type="button" class="button ${variant}" data-action="${action}" ${extra}>${text}</button>`;}
function pill(stage){const cl=stage==="Convertido"?"green":stage==="Reunião agendada"?"blue":stage==="Sem interesse"?"red":stage==="Qualificado"?"gold":"dim";return `<span class="chip ${cl}">${safe(stage)}</span>`;}
function fmt(v){return Number(v||0).toLocaleString("pt-BR");}
function optionStage(active){return STAGES.map(st=>`<option value="${attr(st)}" ${st===active?"selected":""}>${safe(st)}</option>`).join("");}
function render(){if($("#workspace").classList.contains("hidden"))return;$$("[data-view]").forEach(n=>n.classList.toggle("active",n.dataset.view===state.view));$("#current-breadcrumb").textContent=VIEW_NAMES[state.view];$("#nav-lead-count").textContent=state.leads.length;$("#footer-mode").textContent=state.demo?"DEMONSTRAÇÃO • NÃO PRIVADA":"Acesso privado";$("#connection-status").textContent=state.demo?"Modo local":"Sessão autenticada";$("#account-subline").textContent=state.demo?"Dados fictícios":"Administrador";
let content="";
switch(state.view){case "dashboard":content=dashboard();break;case "discover":content=discover();break;case "leads":content=leadsView();break;case "pipeline":content=pipeline();break;case "tasks":content=tasksView();break;case "intelligence":content=intelligence();break;case "reports":content=reports();break;case "settings":content=settings();break;}
$("#main").innerHTML=content;icons();}
function go(view){if(!VIEW_NAMES[view])return;state.view=view;render();$("#sidebar").classList.remove("open");history.replaceState(null,"","#"+view);window.scrollTo({top:0,behavior:"smooth"});}
async function loadRecords(){if(state.demo){render();return;}const {client}=state;if(!client||!state.user)return;const names=["prospect_leads","prospect_tasks","prospect_events"];const res=await Promise.all(names.map(n=>client.from(n).select("*").order("created_at",{ascending:false}).limit(n==="prospect_events"?300:1500)));
res.forEach((r,i)=>{if(r.error)toast("Falha ao consultar "+names[i]+": "+r.error.message,"error");else state[["leads","tasks","events"][i]]=r.data||[];});render();}
function dashboard(){return CAPTURE.home();}
function discover(){return CAPTURE.discover();}
function leadsView(){
const list=state.leads.filter(l=>(!state.searchStage||l.stage===state.searchStage)&&(!state.searchTerm||[l.company_name,l.contact_name,l.sector,l.city,l.neighborhood,l.cnpj].join(" ").toLowerCase().includes(state.searchTerm.toLowerCase())));
return `${pageHeader("CRM / RELACIONAMENTOS","Seus leads.","Acompanhe oportunidades e conversas em um só lugar.",btn(ic("upload")+" Importar CSV","import-csv")+btn(ic("download")+" Exportar CSV","export-csv")+btn(ic("plus")+" Novo lead","lead-new","button-primary"))}
<section class="panel panel-pad"><div class="panel-top"><div><h2 class="panel-title">Empresas cadastradas <span class="badge-number">${fmt(state.leads.length)}</span></h2><p class="panel-sub">Clique no nome para abrir a ficha completa</p></div></div>
<div class="toolbar"><input id="lead-search" class="search-input" placeholder="Buscar nome, setor, CNPJ, bairro..." value="${attr(state.searchTerm)}"><select id="lead-filter"><option value="">Todos os estágios</option>${STAGES.map(s=>`<option value="${attr(s)}" ${s===state.searchStage?"selected":""}>${safe(s)}</option>`).join("")}</select><button class="button" data-action="clear-filters">${ic("filter")} Limpar</button></div>
<div class="table-scroller"><table class="data-table"><thead><tr><th>Empresa / contato</th><th>Localização</th><th>Segmento</th><th>Etapa</th><th>WhatsApp</th><th>Potencial</th><th>Ações</th></tr></thead><tbody>${list.length?list.map(l=>`<tr><td><a href="#" data-action="lead-view" data-id="${attr(l.id)}" class="cell-name">${safe(l.company_name||"Empresa sem nome")}</a><div class="cell-meta">${safe(l.contact_name||l.cnpj||"Sem contato cadastrado")}</div></td><td>${safe([l.neighborhood,l.city].filter(Boolean).join(", ")||"—")}</td><td>${safe(l.sector||"—")}</td><td>${pill(l.stage)}</td><td>${hasConfirmedContact(l)?'<span class="chip green">Contatado</span>':state.events.some(e=>e.lead_id===l.id&&e.kind==="WhatsApp")?'<span class="chip gold">Link aberto</span>':l.opt_in_whatsapp?'<span class="chip blue">Autorizado</span>':'<span class="chip dim">Sem autorização</span>'}</td><td>${l.ai_score===null||l.ai_score===undefined?'<span class="muted">Não analisado</span>':`<span class="chip blue mono">${Number(l.ai_score)}/100</span>`}</td><td class="table-actions"><button class="button" data-action="lead-view" data-id="${attr(l.id)}">Ficha ${ic("arrow",13)}</button>${validWhats(l)?btn(ic("phone")+" WhatsApp","wa-direct","button-green",`data-id="${attr(l.id)}"`):""}</td></tr>`).join(""):'<tr><td colspan="7"><div class="empty">Nenhum lead corresponde aos filtros.</div></td></tr>'}</tbody></table></div></section>
<input id="csv-file" type="file" accept=".csv,text/csv" class="hidden">`;}
function pipeline(){return `${pageHeader("FUNIL DE VENDAS","Pipeline.","Acompanhe o avanço de cada lead.",btn(ic("plus")+" Novo lead","lead-new","button-primary"))}<div class="kanban">${STAGES.map(stage=>{let arr=state.leads.filter(l=>l.stage===stage);return `<section class="kanban-col"><div class="kanban-head">${safe(stage)}<em>${arr.length}</em></div>${arr.length?arr.map(l=>`<div class="kanban-card"><a href="#" data-action="lead-view" data-id="${attr(l.id)}"><strong>${safe(l.company_name||"Empresa")}</strong></a><small>${safe(l.sector||"Sem segmento")} • ${safe(l.neighborhood||l.city||"Sem região")}</small><select aria-label="Mudar estágio" data-change-stage="${attr(l.id)}">${optionStage(l.stage)}</select></div>`).join(""):'<div class="empty-list">Nenhuma oportunidade nesta etapa.</div>'}</section>`;}).join("")}</div>`;}
function tasksView(){
const pending=state.tasks.filter(t=>!t.completed).sort((a,b)=>String(a.due_at||"").localeCompare(String(b.due_at||""))),done=state.tasks.filter(t=>t.completed);
const item=t=>`<div class="task-row ${t.completed?"done":""}"><input aria-label="Concluir tarefa" type="checkbox" data-task-check="${attr(t.id)}" ${t.completed?"checked":""}><div class="task-main"><strong>${safe(t.title)}</strong><small>${safe(t.description||"")} ${t.lead_id?"• Lead vinculado":""}</small></div><span class="task-date">${fmtDate(t.due_at)}</span><button class="icon-button" data-action="task-edit" data-id="${attr(t.id)}" title="Editar tarefa">${ic("more")}</button></div>`;
return `${pageHeader("AGENDA","Acompanhamentos.","Reuniões e próximos contatos.",btn(ic("calendarPlus")+" Nova tarefa","task-new","button-primary"))}<div class="split"><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">Pendentes <span class="badge-number">${pending.length}</span></h2></div><div class="task-list">${pending.length?pending.map(item).join(""):'<div class="empty-list">Nenhuma tarefa pendente.</div>'}</div></section><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">Concluídas <span class="badge-number">${done.length}</span></h2></div><div class="task-list">${done.length?done.slice(0,30).map(item).join(""):'<div class="empty-list">Nenhuma tarefa concluída.</div>'}</div></section></div>`;}
function intelligence(){
const id=state.analysisLeadId||state.leads[0]?.id||"",l=state.leads.find(x=>x.id===id);const analysis=l?.ai_analysis;
return `${pageHeader("INTELIGÊNCIA","Análises comerciais.","Sinais verificados, sem inventar faturamento.",btn(ic("info")+" Como funciona","ai-info"))}
<div class="split"><section class="panel panel-pad"><div class="panel-top"><div><h2 class="panel-title">Diagnóstico de oportunidade</h2><p class="panel-sub">Selecione um lead e avalie seu posicionamento comercial</p></div></div>
<div class="field"><label>Empresa para análise</label><select id="ai-lead"><option value="">Selecione uma empresa</option>${state.leads.map(x=>`<option value="${attr(x.id)}" ${x.id===id?"selected":""}>${safe(x.company_name||x.place_id||"Empresa")}</option>`).join("")}</select></div>
<div class="button-row" style="margin-top:16px">${btn(ic("sparkles")+" Analisar com IA","ai-run","button-primary",!l||state.demo?'disabled title="Requer lead real e API configurada"':"")}${l?btn("Abrir lead","lead-view","button-outline",`data-id="${attr(l.id)}"`):""}</div>
<p class="discovery-note">${state.demo?"Demonstração: não serão exibidos resultados artificiais de IA.":'A análise usa informações declaradas e resultados de fontes verificadas. A API de IA deve estar configurada em uma Edge Function protegida.'}</p></section><section class="panel panel-pad">
${analysis?`<div class="panel-top"><h2 class="panel-title">Potencial comercial estimado</h2><span class="chip blue">Análise documentada</span></div><div class="insight-score mono">${l.ai_score==null?"—":Number(l.ai_score)}<span class="muted" style="font-size:17px">${l.ai_score==null?" sem nota":" /100"}</span></div>${l.ai_score==null?"":`<div class="score-track"><div style="width:${Math.max(0,Math.min(100,Number(l.ai_score)))}%"></div></div>`}<p class="small muted">Pontuação de aderência comercial; não representa patrimônio, faturamento ou capacidade de investimento.</p><div class="divider"></div><strong>${safe(analysis.summary||"Resumo indisponível")}</strong><p class="small muted">${safe(analysis.next_action||"")}</p>`:`<div class="empty">${ic("sparkles",30)}<h3>Uma inteligência que explica</h3><p>Ao configurar a IA, você verá resumos, fatores, fontes, limitações e próximos passos — nunca números financeiros inventados.</p></div>`}
</section></div>${analysis?`<div class="three" style="margin-top:15px"><section class="insight-block"><h3>Oportunidades</h3><p>${(analysis.opportunities||[]).map(safe).join(" • ")||"Não disponível"}</p></section><section class="insight-block"><h3>Fatores e evidências</h3><p>${(analysis.factors||[]).map(safe).join(" • ")||"Não disponível"}</p></section><section class="insight-block"><h3>Limitações da análise</h3><p>${(analysis.missing_data||[]).map(safe).join(" • ")||"Não informado"}</p></section></div>`:""}`;}
function reports(){
const total=state.leads.length,won=state.leads.filter(l=>l.stage==="Convertido").length,meeting=state.leads.filter(l=>l.stage==="Reunião agendada").length,consent=state.leads.filter(l=>l.opt_in_whatsapp).length;
const distribution={};state.leads.forEach(l=>{const key=l.sector||"Não informado";distribution[key]=(distribution[key]||0)+1;});let sectors=Object.entries(distribution).sort((a,b)=>b[1]-a[1]).slice(0,7);
return `${pageHeader("ANÁLISES","Gráficos e resultados.","Resultados reais da sua prospecção.",btn(ic("download")+" Exportar CSV","export-csv")+btn(ic("chart")+" Salvar PDF","print-report","button-primary"))}
<div class="metrics"><div class="panel metric"><div class="metric-label">Leads cadastrados</div><div class="metric-value mono">${fmt(total)}</div><div class="metric-foot">Base total</div></div><div class="panel metric"><div class="metric-label">WhatsApp autorizado</div><div class="metric-value mono">${fmt(consent)}</div><div class="metric-foot">Contatos com permissão registrada</div></div><div class="panel metric"><div class="metric-label">Reuniões</div><div class="metric-value mono">${fmt(meeting)}</div><div class="metric-foot">Etapa de reunião agendada</div></div><div class="panel metric"><div class="metric-label">Taxa de conversão</div><div class="metric-value mono">${total?Math.round(won/total*100):0}%</div><div class="metric-foot">${fmt(won)} convertidos</div></div></div>
<div class="split"><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">Segmentos mais presentes</h2></div><div class="mini-chart">${sectors.length?sectors.map(([sector,n])=>`<div class="chart-row"><span>${safe(sector)}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.round(n/(sectors[0][1]||1)*100)}%"></div></div><span class="chart-count">${n}</span></div>`).join(""):"<p class='muted small'>Cadastre empresas para visualizar os segmentos.</p>"}</div></section><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">Qualidade da base</h2></div><div class="mini-chart">${[["CNPJ identificado",state.leads.filter(l=>l.cnpj).length],["Contato comercial",state.leads.filter(l=>l.contact_phone).length],["Origem documentada",state.leads.filter(l=>l.source_type).length],["Próxima ação definida",state.leads.filter(l=>l.next_contact_at).length]].map(([k,n])=>`<div class="chart-row"><span>${k}</span><div class="chart-track"><div class="chart-fill" style="width:${total?Math.round(n/total*100):0}%"></div></div><span class="chart-count">${n}</span></div>`).join("")}</div></section></div>`;}
function settings(){
const integrations=[
["Banco de dados e login","Supabase Auth e PostgreSQL protegidos por RLS.","shield",!!state.client],
["Captura CNPJ","Fichário: consultas públicas por número, nome e segmento.","building",true],
["Raio em quilômetros","OpenStreetMap: somente empresas com CNPJ vinculado no mapa.","map",true],
["Raio empresarial ampliado","Busca completa num raio exato requer API geográfica contratada.","target",!!C.radiusProviderEnabled],
["GELZ Intelligence","Edge Function com modelo de IA configurado no servidor.","sparkles",!!C.aiEnabled],
["Contatos empresariais","Integração opcional de provedor comercial licenciado.","phone",!!C.contactProviderEnabled],
["WhatsApp","Abertura individual por link, mediante autorização registrada.","phone",true]
];
return `${pageHeader("AJUSTES","Configurações.","Dados do assessor e integrações.",btn(ic("shield")+" Privacidade","privacy-info"))}
<div class="panel panel-pad" style="margin-bottom:18px"><div class="panel-top"><h2 class="panel-title">Perfil do assessor</h2><span class="chip gold">Somente administrador</span></div><form id="profile-form" class="form-grid"><div class="field"><label>Nome profissional</label><input name="advisor_name" value="${attr(state.settings.advisor_name||"Junior Sousa")}" required></div><div class="field"><label>Instituição / escritório</label><input name="institution" value="${attr(state.settings.institution||"Quattro Investimentos")}" required></div><div class="field full"><label>Assinatura nas mensagens</label><input name="signature" value="${attr(state.settings.signature||"Assessor de investimentos")}" required></div><div class="full"><button class="button button-primary" type="submit">Salvar identidade profissional</button></div></form></div>
<div class="panel-top"><h2 class="panel-title">Status das integrações</h2><span class="chip dim">Conectar credenciais no ambiente do servidor</span></div><div class="integrations">${integrations.map(([name,detail,iconName,on])=>`<article class="panel panel-pad integration-card"><div class="integration-icon">${ic(iconName)}</div><h3>${safe(name)}</h3><p>${safe(detail)}</p><span class="chip ${on?"green":"gold"}">${on?"Configurado / verificar funcionamento":"Não configurado"}</span></article>`).join("")}</div>
<div class="warning" style="margin-top:18px">Consultas públicas de CNPJ funcionam sem chave. Para login privado, pesquisa geográfica completa e IA, são necessárias credenciais seguras no backend. O GitHub Pages publica somente a interface.</div>${state.demo?'<p class="small muted" style="margin-top:12px">Modo demonstração não autentica usuários nem salva dados de produção.</p>':""}`;}
function openModal(heading,body,eyebrow="GELZ PROSPECT"){$("#modal-title").textContent=heading;$("#modal-eyebrow").textContent=eyebrow;$("#modal-body").innerHTML=body;$("#overlay").classList.remove("hidden");$("#modal").classList.remove("hidden");icons($("#modal"));$("#modal").scrollTop=0;}
function closeModal(){$("#modal").classList.add("hidden");$("#overlay").classList.add("hidden");}
function editLead(id=null,pid=null){const l=state.leads.find(x=>x.id===id)||null;const v=k=>attr(l?.[k]??"");const isMap=!!pid&&!l;const body=`${isMap?'<div class="info" style="margin-bottom:16px">Você selecionou uma empresa pelo Google Maps. O Place ID será salvo; preencha o nome e dados persistentes usando fonte independente ou informações fornecidas diretamente pela empresa.</div>':""}<form id="lead-form"><input type="hidden" name="id" value="${v("id")}"><input type="hidden" name="place_id" value="${attr(pid||l?.place_id||"")}"><div class="form-grid">
<div class="field full"><label>Nome da empresa *</label><input name="company_name" required maxlength="180" value="${v("company_name")}" placeholder="Razão social ou nome comercial confirmado"></div>
<div class="field"><label>Segmento</label><input name="sector" value="${v("sector")}" placeholder="Ex.: Contabilidade"></div><div class="field"><label>CNPJ (se conhecido)</label><input name="cnpj" value="${v("cnpj")}" placeholder="00.000.000/0000-00" maxlength="18"></div>
<div class="field"><label>Bairro</label><input name="neighborhood" value="${v("neighborhood")}"></div><div class="field"><label>Cidade</label><input name="city" value="${attr(l?.city||"São Paulo")}"></div>
<div class="field"><label>Nome do contato comercial</label><input name="contact_name" value="${v("contact_name")}" placeholder="Informado pela empresa"></div><div class="field"><label>Telefone comercial</label><input name="contact_phone" value="${v("contact_phone")}" placeholder="5511999999999"></div>
<div class="field"><label>E-mail comercial</label><input type="email" name="contact_email" value="${v("contact_email")}" placeholder="contato@empresa.com.br"></div><div class="field"><label>Site oficial</label><input name="website" type="url" value="${v("website")}" placeholder="https://empresa.com.br"></div>
<div class="field full"><label>Fonte do contato / URL de comprovação</label><input name="contact_source_url" value="${v("contact_source_url")}" placeholder="https://empresa.com.br/contato ou origem documentada"></div>
<div class="field"><label>Etapa comercial</label><select name="stage">${optionStage(l?.stage||"Descoberto")}</select></div><div class="field"><label>Próximo contato</label><input type="date" name="next_contact_at" value="${attr(l?.next_contact_at?String(l.next_contact_at).slice(0,10):"")}"></div>
<div class="field full"><label>Observações</label><textarea name="notes" rows="3" placeholder="Contexto do relacionamento, informações verificadas...">${safe(l?.notes||"")}</textarea></div>
<div class="field full"><label class="checkbox-label"><input type="checkbox" name="opt_in_whatsapp" ${l?.opt_in_whatsapp?"checked":""}><span>O contato autorizou comunicações comerciais via WhatsApp para esta finalidade. Não basta o telefone estar disponível na internet.</span></label></div>
<div class="field full"><label>Registro da autorização (data, origem, evidência)</label><input name="opt_in_evidence" value="${v("opt_in_evidence")}" placeholder="Ex.: Autorização expressa recebida em 12/11/2026"></div>
</div><div class="modal-actions">${l?btn("Excluir lead","lead-delete","button-danger",`data-id="${attr(l.id)}"`):""}<button class="button button-primary" type="submit">${ic("check")} Salvar lead</button></div></form>`;
openModal(l?"Editar informações":"Capturar novo lead",body,"CRM / CADASTRO");}
function hasConfirmedContact(l){return !!l&&(["Em conversa","Reunião agendada","Proposta","Convertido"].includes(l.stage)||state.events.some(e=>e.lead_id===l.id&&e.kind==="Contato confirmado"));}
function viewLead(id){const l=state.leads.find(x=>x.id===id);if(!l)return;
const tel=l.contact_phone?`<a class="link mono" href="tel:${CONTACT.normalizeBrazilPhone(l.contact_phone)||attr(l.contact_phone.replace(/\D/g,""))}">${safe(l.contact_phone)}</a>`:"Não informado";const ai=l.ai_analysis;
openModal(l.company_name||"Empresa",`
<div class="button-row" style="margin-bottom:18px">${pill(l.stage)}${l.ai_score!=null?`<span class="chip blue">Potencial ${Number(l.ai_score)}/100</span>`:""}${l.cnpj_verified?'<span class="chip green">CNPJ verificado</span>':""}</div>
<div class="split"><div class="insight-block"><h3>Contato comercial</h3><p>${safe(l.contact_name||"Não identificado")}<br>${tel}<br>${safe(l.contact_email||"Sem e-mail")}</p></div><div class="insight-block"><h3>Empresa</h3><p>${safe(l.sector||"Segmento não informado")}<br>${safe([l.neighborhood,l.city].filter(Boolean).join(", ")||"Localização não informada")}<br>CNPJ: ${safe(l.cnpj||"Não identificado")}</p></div></div>
<div class="insight-block" style="margin-top:12px"><h3>Histórico e fonte</h3><p>Origem: ${safe(l.source_type||"manual")}<br>WhatsApp: ${l.opt_in_whatsapp?"Permissão registrada":"Permissão ainda não documentada"}<br>Fonte: ${safe(l.contact_source_url||"Não informada")}</p></div>
${l.notes?`<div class="insight-block" style="margin-top:12px"><h3>Notas</h3><p>${safe(l.notes)}</p></div>`:""}
${ai?`<div class="insight-block" style="margin-top:12px"><h3>Análise GELZ Intelligence</h3><p>${safe(ai.summary||"")}<br>${safe(ai.next_action||"")}</p></div>`:""}
<div class="button-row" style="margin-top:20px">${btn(ic("phone")+" Abrir WhatsApp","wa-direct","button-green",`data-id="${attr(l.id)}" ${validWhats(l)?"":"disabled"}`)}${btn(ic("copy")+" Editar mensagem","wa-compose","button-subtle",`data-id="${attr(l.id)}"`)}${btn(ic("sparkles")+" Avaliar com IA","lead-analyze","button-subtle",`data-id="${attr(l.id)}"`)}${l.cnpj?btn(ic("building")+" Ficha completa","lead-company-detail","button-subtle",`data-id="${attr(l.id)}"`):btn(ic("building")+" Consultar CNPJ","lead-cnpj","button-subtle",`data-id="${attr(l.id)}"`)}${btn(ic("search")+" Buscar contato comercial","lead-contacts","button-subtle",`data-id="${attr(l.id)}"`)}${l.cnpj?btn(ic("users")+" Sócios / responsáveis","lead-partners","button-subtle",`data-id="${attr(l.id)}"`):""}</div>
<div class="button-row" style="margin-top:12px">${btn(ic("calendarPlus")+" Criar lembrete","task-new","button-outline",`data-id="${attr(l.id)}"`)}${btn("Editar ficha","lead-edit","button-outline",`data-id="${attr(l.id)}"`)}${hasConfirmedContact(l)?"":btn(ic("check")+" Já contatei","lead-contact-confirm","button-outline",`data-id="${attr(l.id)}"`)}</div>
<div class="divider"></div><h3 style="font-size:13px">Histórico de interação</h3>${state.events.filter(e=>e.lead_id===l.id).slice(0,12).map(e=>`<div class="activity"><div class="activity-icon">${ic("clock")}</div><div><strong>${safe(e.kind||"Atividade")}</strong><p>${safe(e.note||"")} • ${fmtDate(e.created_at)}</p></div></div>`).join("")||'<p class="muted small">Nenhuma interação registrada.</p>'}
`,"PERFIL EMPRESARIAL");}
async function storeLead(form){const f=new FormData(form);let data=Object.fromEntries(f.entries());const original=state.leads.find(l=>l.id===data.id);data.company_name=title(data.company_name).slice(0,180);if(!data.company_name){toast("Informe o nome da empresa.","error");return;}
const cleanPhone=String(data.contact_phone||"").replace(/\D/g,"");data.contact_phone=cleanPhone;data.cnpj=String(data.cnpj||"").replace(/\D/g,"");
data.opt_in_whatsapp=f.has("opt_in_whatsapp");if(data.opt_in_whatsapp&&(!data.opt_in_evidence||!data.contact_phone)){toast("Para registrar autorização, informe telefone e evidência da permissão.","error");return;}
if(data.contact_phone&&!/^55\d{10,11}$/.test(data.contact_phone)){toast("Informe o telefone com DDI 55, DDD e número.","error");return;}
if(data.cnpj&&data.cnpj.length!==14){toast("O CNPJ deve ter 14 dígitos.","error");return;}
data.id=original?.id||uid();data.created_at=original?.created_at||new Date().toISOString();data.updated_at=new Date().toISOString();data.source_type=original?.source_type||(data.place_id?"google_place_id":"manual");data.cnpj_verified=original?.cnpj===data.cnpj?!!original.cnpj_verified:false;
data.ai_score=original?.ai_score??null;data.ai_analysis=original?.ai_analysis??null;
data.next_contact_at=data.next_contact_at||null;data.cnae=original?.cnae||"";data.owner_id=state.user?.id||null;
if(state.leads.some(l=>l.id!==data.id&&((data.cnpj&&l.cnpj===data.cnpj)||(data.place_id&&l.place_id===data.place_id)))){toast("Esta empresa já está no CRM (CNPJ ou Place ID repetido).","error");return;}
if(!state.demo){const {error}=await state.client.from("prospect_leads").upsert(data,{onConflict:"id"});if(error){toast("Falha ao salvar lead: "+error.message,"error");return;}}
const i=state.leads.findIndex(l=>l.id===data.id);if(i>=0)state.leads[i]=data;else state.leads.unshift(data);
await recordEvent(data.id,original?"Atualização":"Captura",original?"Informações atualizadas":"Empresa cadastrada no CRM");
closeModal();render();toast("Lead salvo com sucesso.");}
async function deleteLead(id){const l=state.leads.find(x=>x.id===id);if(!l||!confirm(`Excluir ${l.company_name}? Esta ação não pode ser desfeita.`))return;
if(!state.demo){const {error}=await state.client.from("prospect_leads").delete().eq("id",id);if(error){toast("Erro ao excluir: "+error.message,"error");return;}}
state.leads=state.leads.filter(x=>x.id!==id);state.tasks=state.tasks.filter(x=>x.lead_id!==id);state.events=state.events.filter(x=>x.lead_id!==id);closeModal();render();toast("Lead excluído.");}
async function recordEvent(lead_id,kind,note){const evt={id:uid(),owner_id:state.user?.id||null,lead_id,kind,note,created_at:new Date().toISOString()};if(!state.demo&&state.client){const {error}=await state.client.from("prospect_events").insert(evt);if(error){console.warn("Registro de atividade:",error.message);return;}}state.events.unshift(evt);}
async function stageChange(id,value){if(!STAGES.includes(value))return;const l=state.leads.find(x=>x.id===id);if(!l)return;const previous=l.stage;l.stage=value;l.updated_at=new Date().toISOString();if(!state.demo){const {error}=await state.client.from("prospect_leads").update({stage:value,updated_at:l.updated_at}).eq("id",id);if(error){l.stage=previous;toast("Erro ao mudar etapa: "+error.message,"error");render();return;}}await recordEvent(id,"Etapa","De "+previous+" para "+value);render();toast("Pipeline atualizado.");}
function taskForm(id=null,leadId=null){const t=state.tasks.find(x=>x.id===id);openModal(t?"Editar lembrete":"Novo acompanhamento",`<form id="task-form"><input type="hidden" name="id" value="${attr(t?.id||"")}"><div class="form-grid"><div class="field full"><label>Título *</label><input name="title" value="${attr(t?.title||"")}" required placeholder="Ex.: Retornar sobre conta PJ"></div><div class="field"><label>Data de vencimento</label><input name="due_at" type="date" value="${attr(t?.due_at?String(t.due_at).slice(0,10):today())}"></div><div class="field"><label>Lead vinculado</label><select name="lead_id"><option value="">Nenhum</option>${state.leads.map(l=>`<option value="${attr(l.id)}" ${l.id===(leadId||t?.lead_id)?"selected":""}>${safe(l.company_name)}</option>`).join("")}</select></div><div class="field full"><label>Observações</label><textarea name="description">${safe(t?.description||"")}</textarea></div></div><div class="modal-actions"><button class="button button-primary" type="submit">Salvar acompanhamento</button></div></form>`,"AGENDA / ACOMPANHAMENTO");}
async function saveTask(form){const f=new FormData(form);const id=String(f.get("id")||"");const old=state.tasks.find(t=>t.id===id);const obj={id:old?.id||uid(),owner_id:state.user?.id||null,title:title(f.get("title")),description:title(f.get("description")),due_at:f.get("due_at")||null,lead_id:f.get("lead_id")||null,completed:old?.completed||false,created_at:old?.created_at||new Date().toISOString()};if(!obj.title){toast("Informe o título.","error");return;}if(!state.demo){const {error}=await state.client.from("prospect_tasks").upsert(obj);if(error){toast("Erro: "+error.message,"error");return;}}
const i=state.tasks.findIndex(t=>t.id===obj.id);if(i<0)state.tasks.unshift(obj);else state.tasks[i]=obj;closeModal();render();toast("Acompanhamento salvo.");}
async function toggleTask(id,completed){const t=state.tasks.find(x=>x.id===id);if(!t)return;const old=t.completed;t.completed=completed;if(!state.demo){const {error}=await state.client.from("prospect_tasks").update({completed}).eq("id",id);if(error){t.completed=old;toast("Erro ao atualizar tarefa.","error");return;}}render();}

function validWhats(l){return !!CONTACT.normalizeBrazilPhone(l?.contact_phone);}
function messageText(l,kind="intro"){
  const advisor=state.settings.advisor_name||"Junior Sousa";
  const institution=state.settings.institution||"Quattro Investimentos";
  const company=l.company_name||"sua empresa";
  const templates={
    intro:CONTACT.advisorIntro(company,advisor,institution),
    pj:"Olá! Tudo bem? Sou "+advisor+", da "+institution+". Gostaria de conhecer as necessidades da "+company+" e verificar se soluções de conta PJ e gestão de caixa podem ser úteis. Podemos conversar brevemente?",
    meeting:"Olá! Sou "+advisor+", da "+institution+". Podemos agendar 15 minutos para conversar sobre as necessidades da "+company+"?",
    followup:"Olá! Retomando nossa conversa sobre a "+company+". Qual seria um bom momento para continuarmos?"
  };
  return templates[kind]||templates.intro;
}
function openWAUrl(phone,message,leadId=null){
 const url=CONTACT.whatsappLink(phone,message);
 if(!url){toast("Telefone comercial incompleto. Confira DDD e número.","error");return false;}
 const opened=window.open(url,"_blank","noopener,noreferrer");
 if(!opened)window.location.assign(url);
 if(leadId)void recordEvent(leadId,"WhatsApp","Link individual aberto. Mensagem não confirmada como enviada.");
 toast("Conversa aberta. Revise o destinatário e envie manualmente.");
 return true;
}
function directWhats(id){
 const l=state.leads.find(x=>x.id===id);
 if(!l)return;
 openWAUrl(l.contact_phone,messageText(l),l.id);
}
function whatsCompose(id){
 const l=state.leads.find(x=>x.id===id);if(!l)return;
 const num=CONTACT.normalizeBrazilPhone(l.contact_phone);
 openModal("Mensagem para WhatsApp",`<form id="wa-form"><input type="hidden" name="lead_id" value="${attr(l.id)}">
   <div class="wa-topline">${ic("building")} <strong>${safe(l.company_name)}</strong></div><div class="wa-company-info"><span>${ic("briefcase")} ${safe(l.sector||"Setor não informado")}</span><span>${ic("map")} ${safe([l.neighborhood,l.city].filter(Boolean).join(", ")||"Localização não informada")}</span><span class="mono">CNPJ ${safe(l.cnpj||"Não informado")}</span></div>
   <div class="field"><label>Telefone comercial (55 + DDD + número)</label><input id="wa-phone" name="phone" inputmode="tel" autocomplete="tel" value="${attr(num||l.contact_phone||"")}" placeholder="5511999999999"></div>
   <div class="field" style="margin-top:13px"><label>Tipo de abordagem</label><select id="wa-template"><option value="intro">Apresentação</option><option value="pj">Conta PJ</option><option value="meeting">Agendar conversa</option><option value="followup">Retomar contato</option></select></div>
   <div class="field" style="margin-top:13px"><label>Mensagem (você pode editar)</label><textarea name="message" id="wa-message" rows="5">${safe(messageText(l))}</textarea></div>
   <div class="modal-actions">${btn(ic("copy")+" Copiar","wa-copy","button-outline")}<button type="submit" class="button button-green">${ic("phone")} Abrir WhatsApp</button></div>
   <div class="wa-disclaimer">Contato individual. Nenhuma mensagem é enviada automaticamente. Confira se o número é comercial e respeite solicitações para não receber novas mensagens.</div>
   </form>`,"CONTATO / WHATSAPP");
}
async function openWhatsapp(form){
 const data=new FormData(form);
 const leadId=String(data.get("lead_id")||"");
 const phone=String(data.get("phone")||"");
 const message=String(data.get("message")||"").trim();
 if(!message){toast("Digite uma mensagem antes de continuar.","error");return;}
 openWAUrl(phone,message,leadId);
}
async function runAI(id){if(state.demo){demoWarn();return;}const l=state.leads.find(x=>x.id===id);if(!l)return;if(!C.aiEnabled){toast("A IA depende da Edge Function e da chave de API no servidor.","error");return;}
toast("Solicitando análise, usando apenas dados documentados...");
const {data,error}=await state.client.functions.invoke("prospect-analyze",{body:{lead:l}});if(error||!data?.analysis){toast("Não foi possível analisar: "+(error?.message||data?.error||"Resposta indisponível"),"error");return;}
const rawScore=data.analysis.score;const score=rawScore===null||rawScore===undefined?null:Math.max(0,Math.min(100,Number(rawScore)));const updated={...l,ai_score:score,ai_analysis:data.analysis,updated_at:new Date().toISOString()};const {error:dbError}=await state.client.from("prospect_leads").update({ai_score:score,ai_analysis:data.analysis,updated_at:updated.updated_at}).eq("id",l.id);if(dbError){toast("A análise não pôde ser salva: "+dbError.message,"error");return;}
Object.assign(l,updated);await recordEvent(l.id,"Análise","Potencial comercial avaliado com dados informados e limitações documentadas.");state.analysisLeadId=l.id;closeModal();go("intelligence");toast("Análise atualizada.");}
async function enrichCnpj(id){const l=state.leads.find(x=>x.id===id);if(!l)return;openModal("Consultar CNPJ",`<div class="info" style="margin-bottom:16px">Google Maps não contém CNPJ. A validação utiliza serviço empresarial separado, em uma Edge Function segura. Consulta por nome só é feita se houver fornecedor habilitado.</div><form id="cnpj-form"><input name="lead_id" type="hidden" value="${attr(l.id)}"><div class="field"><label>CNPJ para validar</label><input name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" value="${attr(l.cnpj||"")}"></div><div class="modal-actions"><button class="button button-primary" type="submit">Validar CNPJ</button></div></form><div class="divider"></div><button class="button" data-action="cnpj-search" data-id="${attr(l.id)}">${ic("search")} Procurar por nome empresarial (se conectado)</button><div id="cnpj-result"></div>`,"PESQUISA EMPRESARIAL");}
async function callEnrichment(body){if(state.demo){demoWarn();return null;}if(!state.client){toast("Configure o Supabase.","error");return null;}const {data,error}=await state.client.functions.invoke("prospect-enrich",{body});if(error){toast("Consulta não disponível: "+error.message,"error");return null;}if(data?.error){toast("Consulta: "+data.error,"error");return null;}return data;}
async function submitCnpj(form){const l=state.leads.find(x=>x.id===new FormData(form).get("lead_id"));const cnpj=String(new FormData(form).get("cnpj")||"").replace(/\D/g,"");if(!l||cnpj.length!==14){toast("Informe CNPJ com 14 dígitos.","error");return;}let result;
try{if(state.demo||!C.enrichmentEnabled){const item=await CNPJ_API.byCNPJ(cnpj);result={company:{razao_social:item.razao_social||item.company_name,cnae_fiscal_descricao:item.sector},source:item.source};}else result=await callEnrichment({mode:"cnpj",cnpj});}catch(err){toast("Consulta CNPJ: "+err.message,"error");return;}
if(!result?.company)return;
const d=result.company;$("#cnpj-result").innerHTML=`<div class="success-box" style="margin-top:15px"><strong>Empresa localizada</strong><br>${safe(d.razao_social||d.nome||"Empresa")}<br>CNPJ: ${safe(cnpj)}<br>CNAE: ${safe(d.cnae_fiscal_descricao||"Não informado")}<br>Fonte: ${safe(result.source||"Consulta empresarial")}</div><div class="modal-actions">${btn("Associar CNPJ validado","cnpj-save","button-primary",`data-id="${attr(l.id)}" data-cnpj="${cnpj}" data-cnae="${attr(d.cnae_fiscal_descricao||"")}"`)}</div>`;}
async function saveCnpj(id,cnpj,cnae){const l=state.leads.find(x=>x.id===id);if(!l)return;if(state.leads.some(x=>x.id!==id&&x.cnpj===cnpj)){toast("CNPJ já associado a outro lead.","error");return;}
if(!state.demo){const {error}=await state.client.from("prospect_leads").update({cnpj,cnpj_verified:true,cnae}).eq("id",id);if(error){toast(error.message,"error");return;}}
l.cnpj=cnpj;l.cnpj_verified=true;l.cnae=cnae;await recordEvent(id,"CNPJ","CNPJ validado em fonte empresarial autorizada.");viewLead(id);toast("CNPJ associado.");}
async function commercialContacts(id){const l=state.leads.find(x=>x.id===id);if(!l)return;let result;
if((state.demo||!C.contactProviderEnabled)&&l.cnpj){try{const data=await CNPJ_API.byCNPJ(l.cnpj);result={contacts:data.phone?[{value:data.phone,channel:"Telefone comercial público",source:data.source,retrievedAt:new Date().toISOString()}]:[]};}catch(err){toast("Contato comercial: "+err.message,"error");return;}}else result=await callEnrichment({mode:"contacts",companyName:l.company_name,cnpj:l.cnpj,city:l.city});if(!result)return;const contacts=result.contacts||[];openModal("Contatos comerciais",`<div class="info">Contatos fornecidos por fonte empresarial licenciada. Verifique a origem e obtenha autorização antes de usar o WhatsApp. Nenhum telefone é salvo automaticamente.</div><div class="list-stack" style="margin-top:18px">${contacts.length?contacts.map(x=>`<div class="insight-block"><h3>${safe(x.channel||"Canal comercial")}</h3><p>${safe(x.value||"")}<br>Fonte: ${safe(x.source||"")}<br>Obtido em: ${fmtDate(x.retrievedAt)}</p></div>`).join(""):"<p class=muted>Nenhum contato comercial localizado no fornecedor conectado.</p>"}</div><div class="modal-actions">${btn("Editar lead e registrar fonte","lead-edit","button-primary",`data-id="${attr(id)}"`)}</div>`,"ENRIQUECIMENTO / CONTATOS");}
async function searchCnpjByName(id){const l=state.leads.find(x=>x.id===id);if(!l)return;let r;
if(state.demo||!C.enrichmentEnabled){try{const data=await CNPJ_API.byName({query:l.company_name,city:l.city||"São Paulo",uf:"SP"});r={candidates:data.items.map(x=>({cnpj:x.cnpj,razao_social:x.razao_social||x.company_name,municipio:x.city,uf:x.uf}))};}catch(err){toast("Busca CNPJ: "+err.message,"error");return;}}else r=await callEnrichment({mode:"search",companyName:l.company_name,city:l.city});if(!r)return;const candidates=r.candidates||[];$("#cnpj-result").innerHTML=candidates.length?`<div class="list-stack" style="margin-top:15px">${candidates.slice(0,8).map(x=>`<div class="insight-block"><strong>${safe(x.razao_social||x.nome||"Empresa")}</strong><p>CNPJ: ${safe(x.cnpj||"")}<br>${safe(x.municipio||"")} • ${safe(x.uf||"")}</p>${btn("Validar este CNPJ","cnpj-candidate","button-outline",`data-id="${attr(id)}" data-cnpj="${attr(x.cnpj||"")}"`)}</div>`).join("")}</div>`:'<p class="muted small">Sem candidatos encontrados. Revise os dados ou informe o CNPJ manualmente.</p>';}
async function saveProfile(form){const f=new FormData(form);state.settings={advisor_name:title(f.get("advisor_name")),institution:title(f.get("institution")),signature:title(f.get("signature"))};if(state.demo){toast("Preferências somente nesta demonstração.");return;}const {error}=await state.client.from("prospect_preferences").upsert({owner_id:state.user.id,...state.settings},{onConflict:"owner_id"});if(error){toast("Falha ao salvar preferências: "+error.message,"error");return;}toast("Identidade profissional atualizada.");}
function downloadCSV(){const cols=["company_name","sector","cnpj","contact_name","contact_phone","contact_email","contact_source_url","opt_in_whatsapp","opt_in_evidence","city","neighborhood","stage","notes","next_contact_at","place_id","source_type"];const data=[cols.join(";"),...state.leads.map(l=>cols.map(k=>{const v=String(l[k]??"");const safeCsv=/^[=+\-@\t\r]/.test(v)?"'"+v:v;return `"${safeCsv.replace(/"/g,'""')}"`;}).join(";"))].join("\r\n");const a=document.createElement("a");const url=URL.createObjectURL(new Blob(["\uFEFF"+data],{type:"text/csv;charset=utf-8"}));a.href=url;a.download="gelz-prospect-leads.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function parseCSV(input){const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===";"||c===","){row.push(cell);cell="";}else if(c==="\n"){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell="";}else cell+=c;}if(cell.length||row.length){row.push(cell);rows.push(row);}return rows;}
async function importCSV(file){if(!file)return;let rows=parseCSV((await file.text()).replace(/^\uFEFF/,""));if(!rows.length){toast("Arquivo vazio.","error");return;}const headers=rows.shift().map(s=>s.trim());if(!headers.includes("company_name")){toast("CSV deve conter coluna company_name.","error");return;}
let inserted=0;for(const r of rows.slice(0,400)){const obj={};headers.forEach((key,i)=>obj[key]=r[i]||"");if(!obj.company_name?.trim())continue;const existing=state.leads.some(l=>(obj.cnpj&&l.cnpj===obj.cnpj)||(obj.place_id&&l.place_id===obj.place_id));if(existing)continue;
const candidate={id:uid(),owner_id:state.user?.id||null,company_name:String(obj.company_name).slice(0,180),sector:obj.sector||"",city:obj.city||"",neighborhood:obj.neighborhood||"",cnpj:String(obj.cnpj||"").replace(/\D/g,""),cnpj_verified:false,cnae:"",place_id:obj.place_id||"",source_type:"importado",contact_name:obj.contact_name||"",contact_phone:String(obj.contact_phone||"").replace(/\D/g,""),contact_email:obj.contact_email||"",contact_source_url:obj.contact_source_url||"",opt_in_whatsapp:false,opt_in_evidence:"",website:"",notes:obj.notes||"",next_contact_at:null,stage:STAGES.includes(obj.stage)?obj.stage:"Descoberto",ai_score:null,ai_analysis:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
if(!state.demo){const {error}=await state.client.from("prospect_leads").insert(candidate);if(error){toast("Falha ao importar: "+error.message,"error");break;}}state.leads.push(candidate);inserted++;}
render();toast(`${inserted} leads importados. Autorizações de WhatsApp não são presumidas.`);}
function command(open){$("#command").classList.toggle("hidden",!open);if(open){$("#command-input").value="";renderCommand("");$("#command-input").focus();}}
function renderCommand(term){const q=term.toLowerCase(),items=[...Object.entries(VIEW_NAMES).map(([id,name])=>({name,action:"nav-"+id,icon:"arrow",id:""})),...state.leads.map(l=>({name:l.company_name||"Lead",action:"lead-view",icon:"building",id:l.id}))].filter(x=>x.name.toLowerCase().includes(q)).slice(0,15);$("#command-results").innerHTML=items.length?items.map(x=>`<button class="command-result" data-action="${x.action}" data-id="${attr(x.id)}">${ic(x.icon)} ${safe(x.name)}</button>`).join(""):'<div class="empty-list">Nada encontrado.</div>';}
async function onAction(action,id,element){if(action.startsWith("capture-")){await CAPTURE.action(action,id);return;}if(action.startsWith("nav-")){closeModal();command(false);go(action.slice(4));return;}switch(action){
case "lead-new":editLead();break;
case "lead-view":command(false);viewLead(id);break;
case "lead-edit":editLead(id);break;
case "lead-delete":await deleteLead(id);break;
case "lead-contact-confirm":await CAPTURE.action("capture-contacted",id);break;

case "task-new":taskForm(null,id);break;
case "task-edit":taskForm(id);break;
case "wa-compose":whatsCompose(id);break;
case "wa-direct":directWhats(id);break;
case "wa-copy":await navigator.clipboard.writeText($("#wa-message")?.value||"");toast("Mensagem copiada.");break;
case "lead-analyze":state.analysisLeadId=id;closeModal();go("intelligence");break;
case "ai-run":await runAI($("#ai-lead")?.value||state.analysisLeadId);break;
case "lead-cnpj":enrichCnpj(id);break;
case "lead-company-detail":{const lead=state.leads.find(x=>x.id===id);if(lead?.cnpj)await CAPTURE.action("capture-detail",lead.cnpj);else toast("Cadastre o CNPJ para consultar a ficha.","error");break;}
case "lead-contacts":await commercialContacts(id);break;
case "lead-partners":{const company=state.leads.find(x=>x.id===id);if(company?.cnpj)await CAPTURE.action("capture-partners",company.cnpj);else toast("Lead sem CNPJ válido.","error");break;}
case "cnpj-search":await searchCnpjByName(id);break;
case "cnpj-save":await saveCnpj(id,element.dataset.cnpj,element.dataset.cnae);break;
case "cnpj-candidate":{const input=$("#cnpj-form input[name=cnpj]");if(input){input.value=element.dataset.cnpj;$("#cnpj-form").requestSubmit();}}break;
case "export-csv":downloadCSV();break;
case "import-csv":$("#csv-file")?.click();break;
case "print-report":window.print();break;
case "clear-filters":state.searchTerm="";state.searchStage="";render();break;
case "ai-info":openModal("Análise responsável",`<p>A IA auxilia na triagem de oportunidades a partir de informações empresariais fornecidas ou verificadas. A pontuação não estima o patrimônio do empresário, faturamento não comprovado ou montante disponível para investir.</p><div class="warning">Resultados dependem de fontes confiáveis e de uma API de IA configurada no servidor. Não confundir potencial comercial com adequação a produtos de investimento.</div>`,"TRANSPARÊNCIA / IA");break;
case "privacy-info":openModal("Privacidade e conformidade",`<p>Os dados dos leads devem ter finalidade definida, origem documentada, acesso restrito e mecanismos para correção, exclusão e oposição ao contato.</p><p>Evite coleta de números pessoais por bots, coleta não autorizada e disparos automáticos. A política do WhatsApp exige condições próprias de autorização comercial. Verifique também as regras da instituição e da CVM.</p>`,"SEGURANÇA / COMPLIANCE");break;
}}
async function initialize(){
icons();const configured=Boolean(C.supabaseUrl&&C.supabaseAnonKey&&C.adminEmail);
if(!configured){$("#setup-panel").classList.remove("hidden");$("#auth-error").classList.add("hidden");return;}
try{const mod=await import("https://esm.sh/@supabase/supabase-js@2.49.10");state.client=mod.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const {data}=await state.client.auth.getUser();if(data?.user)await verifyAdmin(data.user);}catch(err){$("#setup-panel").classList.remove("hidden");$("#auth-error").textContent="Não foi possível inicializar a autenticação: "+err.message;$("#auth-error").classList.remove("hidden");}}
async function verifyAdmin(user){const email=String(user.email||"").toLowerCase();if(email!==String(C.adminEmail||"").toLowerCase()){await state.client.auth.signOut();$("#auth-error").textContent="Esta conta não está autorizada.";$("#auth-error").classList.remove("hidden");return;}
const {data,error}=await state.client.from("prospect_admins").select("id,username,must_change_password").eq("id",user.id).maybeSingle();if(error||!data||data.username!=="admin"){await state.client.auth.signOut();$("#auth-error").textContent="Conta sem autorização de administrador. Complete o SQL e registre o usuário admin no banco.";$("#auth-error").classList.remove("hidden");return;}
state.user=user;state.account=data;if(data.must_change_password){$("#login-form").classList.add("hidden");$("#rotate-box").classList.remove("hidden");$("#auth-error").classList.add("hidden");return;}
$("#auth-screen").classList.add("hidden");$("#workspace").classList.remove("hidden");const {data:prefs}=await state.client.from("prospect_preferences").select("*").eq("owner_id",user.id).maybeSingle();state.settings=prefs||{advisor_name:"Junior Sousa",institution:"Quattro Investimentos",signature:"Assessor de investimentos"};
const hash=location.hash.replace("#","");state.view=VIEW_NAMES[hash]?hash:"dashboard";await loadRecords();void CAPTURE.autoStart();}
$("#login-form").addEventListener("submit",async e=>{e.preventDefault();const u=$("#username").value.trim(),p=$("#password").value;if(u!=="admin"){toast("Usuário não autorizado.","error");return;}if(!state.client){if(p==="admin"){enterDemo();return;}toast("Em demonstração, use admin/admin. Produção requer Supabase configurado.","error");return;}$("#login-button").disabled=true;try{const {data,error}=await state.client.auth.signInWithPassword({email:C.adminEmail,password:p});if(error)throw error;await verifyAdmin(data.user);}catch(err){$("#auth-error").textContent="Falha ao entrar: "+err.message;$("#auth-error").classList.remove("hidden");}finally{$("#login-button").disabled=false;}});
$("#rotate-form").addEventListener("submit",async e=>{e.preventDefault();const p=$("#new-password").value;if(p.length<12||p!==$("#confirm-password").value){toast("A senha precisa ter pelo menos 12 caracteres e coincidir nos campos.","error");return;}const {error}=await state.client.auth.updateUser({password:p});if(error){toast("Não foi possível atualizar: "+error.message,"error");return;}$("#rotate-box").classList.add("hidden");toast("Senha atualizada. Verificando permissão...");await verifyAdmin(state.user);});
function enterDemo(){state.demo=true;state.leads=[];state.tasks=[];state.events=[];state.settings={advisor_name:"Junior Sousa",institution:"Quattro Investimentos",signature:"Assessor de investimentos"};$("#auth-screen").classList.add("hidden");$("#workspace").classList.remove("hidden");render();void CAPTURE.autoStart();toast("Demonstração aberta. Os CNPJs são reais; leads salvos são temporários.");}
$("#demo-button").addEventListener("click",enterDemo);
$("#toggle-password").addEventListener("click",()=>{const el=$("#password");el.type=el.type==="password"?"text":"password";});
$("#logout").addEventListener("click",async()=>{if(!state.demo&&state.client)await state.client.auth.signOut();state.user=null;state.account=null;state.demo=false;state.leads=[];state.tasks=[];state.events=[];$("#workspace").classList.add("hidden");$("#auth-screen").classList.remove("hidden");$("#rotate-box").classList.add("hidden");$("#login-form").classList.remove("hidden");$("#password").value="";$("#sidebar").classList.remove("open");});
$("#quick-add").addEventListener("click",()=>editLead());
$("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#modal-close").addEventListener("click",closeModal);$("#overlay").addEventListener("click",closeModal);
$("#global-search").addEventListener("click",()=>command(true));
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();command(true);}if(e.key==="Escape"){command(false);closeModal();$("#sidebar").classList.remove("open");}});
$("#command").addEventListener("click",e=>{if(e.target.id==="command")command(false);});
$("#command-input").addEventListener("input",e=>renderCommand(e.target.value));
document.addEventListener("click",async e=>{const nav=e.target.closest("[data-view]");if(nav){e.preventDefault();go(nav.dataset.view);return;}const n=e.target.closest("[data-action]");if(!n)return;if(n.tagName==="A")e.preventDefault();await onAction(n.dataset.action,n.dataset.id||n.dataset.cnpj,n);});
document.addEventListener("submit",async e=>{const f=e.target;if(!["lead-form","task-form","wa-form","cnpj-form","profile-form","capture-form"].includes(f.id))return;e.preventDefault();const submit=f.querySelector('button[type="submit"]');if(submit)submit.disabled=true;try{if(f.id==="lead-form")await storeLead(f);else if(f.id==="task-form")await saveTask(f);else if(f.id==="wa-form")await openWhatsapp(f);else if(f.id==="cnpj-form")await submitCnpj(f);else if(f.id==="profile-form")await saveProfile(f);else if(f.id==="capture-form")await CAPTURE.submit(f);}catch(err){toast("Falha: "+err.message,"error");}finally{if(submit&&submit.isConnected)submit.disabled=false;}});
document.addEventListener("input",e=>{if(e.target.id==="lead-search"){state.searchTerm=e.target.value;const start=e.target.selectionStart;const end=e.target.selectionEnd;render();$("#lead-search")?.focus();$("#lead-search")?.setSelectionRange(start,end);}});
document.addEventListener("change",async e=>{const el=e.target;if(el.id==="capture-mode"){CAPTURE.changeMode(el.value);}else if(el.id==="lead-filter"){state.searchStage=el.value;render();}else if(el.dataset.changeStage){await stageChange(el.dataset.changeStage,el.value);}else if(el.dataset.taskCheck){await toggleTask(el.dataset.taskCheck,el.checked);}else if(el.id==="ai-lead"){state.analysisLeadId=el.value;render();}else if(el.id==="wa-template"){const id=$("#wa-form input[name=lead_id]").value;const l=state.leads.find(x=>x.id===id);if(l)$("#wa-message").value=messageText(l,el.value);}else if(el.id==="csv-file"){await importCSV(el.files[0]);el.value="";}});
await initialize();
})();