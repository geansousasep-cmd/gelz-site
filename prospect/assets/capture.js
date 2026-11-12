import * as CNPJ from './cnpj-engine.js';

  let h=null;
  const segments=[["6920601","Contabilidade"],["7020400","Consultoria"],["6204000","Tecnologia"],["6821801","Imobiliárias"],["4930202","Transportadoras"],["4781400","Vestuário"],["5611201","Restaurantes"],["8630503","Clínicas"]];
  const app={mode:"sector",city:"São Paulo",uf:"SP",neighborhood:"Tatuapé",radius:3,cnae:"6920601",term:"",items:[],total:0,loading:false,searched:false,error:"",notice:""};
  const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const digits=v=>String(v??"").replace(/\D/g,"");
  const ico=(name)=>h.ic(name,16);
  const button=(label,action,id="",kind="button-subtle")=>`<button class="button ${kind}" type="button" data-action="${action}" ${id?`data-cnpj="${safe(id)}" data-id="${safe(id)}"`:""}>${label}</button>`;
  const linked=x=>h.state.leads.find(l=>x.cnpj&&l.cnpj===x.cnpj);
  const touched=l=>!!l&&(["Em conversa","Reunião agendada","Proposta","Convertido"].includes(l.stage)||h.state.events.some(e=>e.lead_id===l.id&&e.kind==="Contato confirmado"));
  const score=x=>CNPJ.potential(x);
  const order=()=>[...app.items].sort((a,b)=>(score(b).score??-1)-(score(a).score??-1));
  const badge=x=>{const l=linked(x);return !l?'<span class="chip dim">Novo</span>':touched(l)?'<span class="chip green">Contatado</span>':l.stage==="Sem interesse"?'<span class="chip red">Sem interesse</span>':'<span class="chip blue">Salvo</span>';};
  function form(){
    const opt=(value,label)=>`<option value="${value}" ${app.mode===value?"selected":""}>${label}</option>`;
    const field=(name,label,body,show=true)=>`<div class="field" data-capture-field="${name}" ${show?"":'style="display:none"'}><label>${label}</label>${body}</div>`;
    return `<section class="panel prospect-search"><div class="prospect-search-title"><div><span class="eyebrow">GELZ / BUSINESS INTELLIGENCE</span><h2>${ico("search")} Buscar CNPJ e empresas</h2></div><span class="chip blue">${ico("shield")} Dados públicos</span></div>
      <form id="capture-form" class="prospect-form">
      ${field("mode","Tipo de pesquisa",`<select name="mode" id="capture-mode">${opt("sector","Por segmento")}${opt("cnpj","Pelo CNPJ")}${opt("name","Pelo nome")}${opt("radius","Por raio (km)")}</select>`)}
      ${field("cnpj","CNPJ",`<input name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" value="${app.mode==="cnpj"?safe(app.term):""}">`,app.mode==="cnpj")}
      ${field("name","Empresa",`<input name="name" placeholder="Nome fantasia ou razão social" value="${app.mode==="name"?safe(app.term):""}">`,app.mode==="name")}
      ${field("sector","Segmento",`<select name="cnae">${segments.map(([v,n])=>`<option value="${v}" ${app.cnae===v?"selected":""}>${n}</option>`).join("")}</select>`,(app.mode==="sector"||app.mode==="radius"))}
      ${field("city","Cidade",`<input name="city" value="${safe(app.city)}">`,app.mode!=="cnpj")}
      ${field("uf","UF",`<select name="uf">${["SP","RJ","MG","SC","PR","RS","BA","GO","PE","DF","ES","CE"].map(v=>`<option ${app.uf===v?"selected":""}>${v}</option>`).join("")}</select>`,app.mode!=="cnpj")}
      ${field("neighborhood","Bairro / ponto",`<input name="neighborhood" value="${safe(app.neighborhood)}">`,app.mode==="radius")}
      ${field("radius","Raio",`<select name="radius">${[1,2,3,5,10,15].map(v=>`<option value="${v}" ${app.radius===v?"selected":""}>${v} km</option>`).join("")}</select>`,app.mode==="radius")}
      <button type="submit" class="button button-primary prospect-cta" ${app.loading?"disabled":""}>${app.loading?ico("refresh")+" Pesquisando...":ico("search")+" Encontrar leads"}</button></form>
      <div class="prospect-hint" id="capture-hint">${hint()}</div></section>`;
  }
  function hint(){return app.mode==="radius"?(window.GELZ_CONFIG?.radiusProviderEnabled?"Busca por raio exato usando fornecedor empresarial autenticado.":"Raio real usando OpenStreetMap: somente empresas com CNPJ mapeado. Cobertura limitada."):(app.mode==="sector"?"Pesquisa por CNAE e cidade, não por distância.":"Consulta real em base pública de CNPJs.");}
  function metrics(){
    const good=app.items.filter(x=>(score(x).score??-1)>=70).length,contacted=h.state.leads.filter(touched).length;
    const list=[["CNPJs encontrados",app.items.length,"building"],["Em destaque",good,"sparkles"],["Salvos no CRM",h.state.leads.length,"users"],["Contatados",contacted,"phone"]];
    return `<section class="prospect-metrics">${list.map(([label,value,icon])=>`<div class="panel prospect-metric"><span>${safe(label)} ${ico(icon)}</span><strong>${Number(value).toLocaleString("pt-BR")}</strong></div>`).join("")}</section>`;
  }
  function rows(n){
    return order().slice(0,n).map((x,i)=>{
      const s=score(x),saved=linked(x),phone=saved?.contact_phone||x.phone||"",contact=phone?`<span class="mono contact-no">${safe(phone)}</span>`:"<small class='muted'>Sem número</small>";
      return `<tr><td><span class="rank-idx">${String(i+1).padStart(2,"0")}</span></td><td><strong class="result-name">${safe(x.company_name)}</strong><small>${safe([x.neighborhood,x.city,x.uf].filter(Boolean).join(" • "))}</small></td><td><span class="mono">${safe(x.cnpj)}</span></td><td><span class="prospect-score">${s.score==null?"—":s.score}<small>/100</small></span><small>${safe(s.evidence)}</small></td><td>${badge(x)}<div style="margin-top:5px">${contact}</div></td><td class="result-buttons">${saved?button("Abrir","lead-view",saved.id):button(ico("plus")+" Salvar","capture-save",x.cnpj,"button-primary")}${button(ico("info"),"capture-detail",x.cnpj)}</td></tr>`;
    }).join("");
  }
  function results(n=12){
    return `<section class="panel panel-pad prospect-results"><div class="panel-top"><div><h2 class="panel-title">${ico("chart")} Ranking de oportunidades <span class="badge-number">${app.items.length}</span></h2><p class="panel-sub">${app.loading?"Consultando bases públicas...":app.searched?`${app.items.length} empresas verificadas nesta página`:"Pesquise para ver empresas reais"}</p></div>${app.items.length?button(ico("download")+" Exportar","capture-export"):""}</div>
    ${app.error?`<div class="warning">${safe(app.error)} <a href="https://fichario.app/api" class="link" target="_blank" rel="noopener noreferrer">Ver API</a></div>`:app.loading?'<div class="loading-stripes"><span></span><span></span><span></span></div>':app.items.length?`<div class="table-scroller"><table class="data-table"><thead><tr><th>#</th><th>Empresa</th><th>CNPJ</th><th>Sinal</th><th>Status / telefone</th><th>Ações</th></tr></thead><tbody>${rows(n)}</tbody></table></div>`:`<div class="prospect-empty">${ico("building")}<strong>${app.searched?"Nenhum CNPJ identificado":"Encontre seu próximo lead"}</strong><small>${app.searched?"Altere a busca ou tente novamente.":"Escolha um segmento ou informe o CNPJ."}</small></div>`}
    <p class="prospect-footnote">Ranking indicativo por porte e capital social declarado. Não mede faturamento, patrimônio nem capacidade de investir. Fonte: <a href="https://fichario.app/api" target="_blank" rel="noopener noreferrer">Fichário</a> / dados abertos da Receita. ${safe(app.notice||"")}</p></section>`;
  }
  function stats(){
    const s=h.state,counts=s.leads.reduce((a,l)=>{a[l.stage]=(a[l.stage]||0)+1;return a;},{});
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const colors=["#88b4ee","#b5c9ec","#70cba8","#dec393","#7d93b6"];
    const total=s.leads.length;
    let offset=0;const gradients=entries.map(([k,n],i)=>{let from=offset;offset+=n/Math.max(total,1)*100;return `${colors[i]} ${from.toFixed(2)}% ${offset.toFixed(2)}%`;});
    const upcoming=s.tasks.filter(x=>!x.completed).slice(0,3);
    return `<div class="dashboard-lower prospect-stats"><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">${ico("chart")} CRM em números</h2>${button("Ver funil","nav-pipeline")}</div><div class="prospect-chart-row"><div class="prospect-donut" style="background:conic-gradient(${gradients.length?gradients.join(","):"#29364a 0 100%"})"><div><b>${total}</b><span>Leads</span></div></div><div class="prospect-legend">${entries.map(([label,n],i)=>`<div><i style="background:${colors[i]}"></i><span>${safe(label)}</span><b>${n}</b></div>`).join("")||'<span class="muted">Nenhum lead salvo.</span>'}</div></div></section><section class="panel panel-pad"><div class="panel-top"><h2 class="panel-title">${ico("clock")} Próximos passos</h2>${button(ico("plus"),"task-new")}</div>${upcoming.length?upcoming.map(t=>`<div class="activity"><div class="activity-icon">${ico("calendar")}</div><div><strong>${safe(t.title)}</strong><p>${h.fmtDate(t.due_at)}</p></div></div>`).join(""):'<div class="prospect-empty compact"><strong>Agenda livre</strong><small>Cadastre o próximo acompanhamento.</small></div>'}</section></div>`;
  }
  function pageHeader(explore=false){return `<div class="page-header prospect-page-heading"><div><div class="eyebrow">${explore?"PESQUISA EMPRESARIAL":"GELZ PROSPECT / HOME"}</div><h1>${explore?"Capturar empresas.":"Seu próximo cliente começa aqui."}</h1><p>${explore?"CNPJ e setores reais, organizados por oportunidade.":"Busque empresas, salve leads e acompanhe conversas."}</p></div><div class="page-actions">${button(ico("users")+" CRM","nav-leads")}${button(ico("plus")+" Novo lead","lead-new","","button-primary")}</div></div>`;}
  function home(){return pageHeader(false)+form()+metrics()+results(10)+stats();}
  function discover(){return pageHeader(true)+form()+results(40);}
  function setup(deps){h=deps;}
  async function submit(formElement){
    const f=new FormData(formElement);app.mode=String(f.get("mode")||"sector");app.city=String(f.get("city")||app.city);app.uf=String(f.get("uf")||app.uf);app.neighborhood=String(f.get("neighborhood")||app.neighborhood);app.radius=Number(f.get("radius")||app.radius);app.cnae=String(f.get("cnae")||app.cnae);app.term=String(f.get(app.mode==="cnpj"?"cnpj":"name")||"").trim();
    app.loading=true;app.error="";app.notice="";app.searched=true;app.items=[];h.render();
    try{
      let result;
      if(app.mode==="cnpj"){result={items:[await CNPJ.byCNPJ(app.term)]};}
      else if(app.mode==="name"){result=await CNPJ.byName({query:app.term,city:app.city,uf:app.uf});}
      else if(app.mode==="sector"){result=await CNPJ.bySector({city:app.city,uf:app.uf,cnae:app.cnae});}
      else if(window.GELZ_CONFIG?.radiusProviderEnabled&&!h.state.demo&&h.state.client){
        const center=await CNPJ.geocodeCenter({city:app.city,neighborhood:app.neighborhood});
        const {data,error}=await h.state.client.functions.invoke("prospect-enrich",{body:{mode:"radius",latitude:center.latitude,longitude:center.longitude,radiusKm:app.radius,cnae:app.cnae}});
        if(error||data?.error)throw Error(error?.message||data?.error||"Busca geográfica indisponível");
        result={items:(data?.items||[]).map(x=>CNPJ.normalize(x,"API CNPJs / raio exato")),total:data?.total||0,notice:"Empresas localizadas dentro do raio definido. Fonte: fornecedor cadastral contratado."};
      }else result=await CNPJ.byRadius({city:app.city,neighborhood:app.neighborhood,radiusKm:app.radius});
      if(result.items?.length&&app.mode!=="cnpj"&&app.mode!=="radius")result.items=await CNPJ.enrich(result.items,Math.min(8,result.items.length));
      app.items=(result.items||[]).filter(x=>x.verified);app.total=result.total??app.items.length;app.notice=result.notice||"";
      if(!app.items.length)h.toast("Nenhum resultado confirmado para esta busca.");
    }catch(err){app.error=err.message||"Consulta indisponível";h.toast("CNPJ: "+app.error,"error");}finally{app.loading=false;h.render();}
  }
  function changeMode(mode){
    app.mode=mode;const el=document.querySelector("#capture-form");if(!el)return;
    el.querySelectorAll("[data-capture-field]").forEach(f=>{const k=f.dataset.captureField;f.style.display=k==="mode"||k===mode||(mode!=="cnpj"&&["city","uf"].includes(k))||(mode==="radius"&&k==="sector")?"":"none";});
    const caption=document.querySelector("#capture-hint");if(caption)caption.textContent=hint();
  }
  function detail(id){
    const x=app.items.find(x=>x.cnpj===id);if(!x)return;const money=Number(x.capital_social||0),s=score(x),stored=linked(x);
    h.openModal(x.company_name,`<div class="chip blue">${ico("building")} CNPJ ${safe(x.cnpj)}</div><div class="prospect-profile">
    <div><small>Porte</small><strong>${safe(x.porte||"Não informado")}</strong></div>
    <div><small>Capital social</small><strong>${money?money.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"Não informado"}</strong></div>
    <div><small>Sinal comercial</small><strong>${s.score===null?"—":s.score+"/100"}</strong></div></div>
    <div class="insight-block"><h3>Informações cadastrais</h3><p>${safe(x.razao_social||x.company_name)}<br>${safe([x.neighborhood,x.city,x.uf].filter(Boolean).join(" • "))}<br>${safe(x.sector||"Sem atividade")}<br>Telefone comercial: ${safe(x.phone||"Não divulgado")}</p></div>
    <div class="info" style="margin-top:14px">Pontuação para triagem, não significa patrimônio ou caixa disponíveis. ${safe(s.evidence)}</div>
    <p><a href="${safe(x.sourceUrl||"https://fichario.app/api")}" target="_blank" rel="noopener noreferrer" class="link">Conferir cadastro na fonte</a></p>
    <div class="modal-actions">${stored?button("Abrir no CRM","lead-view",stored.id,"button-primary"):button(ico("plus")+" Salvar no CRM","capture-save",id,"button-primary")}</div>`,"CAPTURA / CNPJ");
  }
  async function save(id){
    const x=app.items.find(x=>x.cnpj===id);if(!x)return;const old=linked(x);if(old){h.viewLead(old.id);return;}
    const raw=digits(x.phone||"");const phone=/^55\d{10,11}$/.test(raw)?raw:/^\d{10,11}$/.test(raw)?"55"+raw:"";
    const now=new Date().toISOString();
    const record={id:crypto.randomUUID(),owner_id:h.state.user?.id||null,company_name:x.company_name,sector:x.sector||"",city:x.city||app.city,neighborhood:x.neighborhood||"",cnpj:x.cnpj,cnpj_verified:false,cnae:x.cnae||"",place_id:"",source_type:"fichario_cnpj",contact_name:"",contact_phone:phone,contact_email:"",contact_source_url:x.sourceUrl||"",website:x.site||"",opt_in_whatsapp:false,opt_in_evidence:"",stage:"Descoberto",notes:`Fonte: ${x.source}. Capital social cadastral: ${x.capital_social||"não informado"}.`,next_contact_at:null,ai_score:null,ai_analysis:null,created_at:now,updated_at:now};
    if(!h.state.demo){const {error}=await h.state.client.from("prospect_leads").insert(record);if(error){h.toast("Não foi possível salvar: "+error.message,"error");return;}}
    h.state.leads.unshift(record);await h.recordEvent(record.id,"Captura","Empresa capturada de base pública de CNPJ");h.closeModal();h.render();h.toast("CNPJ salvo no CRM.");
  }
  async function contacted(id){
    const company=h.state.leads.find(l=>l.id===id);if(!company)return;
    if(!window.confirm("Confirmar que houve contato real com esta empresa?"))return;
    await h.stageChange(id,"Em conversa");await h.recordEvent(id,"Contato confirmado","Contato informado manualmente pelo administrador.");h.render();
  }
  function csv(){
    const records=order().map(x=>[x.cnpj,x.company_name,x.razao_social,x.sector,x.city,x.uf,x.porte,x.capital_social,score(x).score??"",x.sourceUrl]);
    const content=[["CNPJ","Nome","Razão Social","Segmento","Cidade","UF","Porte","Capital Social","Sinal","Fonte"],...records].map(r=>r.map(v=>'"'+(/^[-+=@]/.test(String(v))?"'":"")+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+content],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="gelz-cnpj-oportunidades.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),6000);
  }
  async function action(name,id){
    if(name==="capture-detail")detail(id);
    else if(name==="capture-save")await save(id);
    else if(name==="capture-export")csv();
    else if(name==="capture-contacted")await contacted(id);
  }

export { setup, home, discover, submit, changeMode, action };
