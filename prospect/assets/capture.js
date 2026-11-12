import * as CNPJ from './cnpj-engine.js';
import * as CONTACT from './contact-utils.js';
import * as RESEARCH from './research.js';

  let h=null;
  const segments=[["6920601","Contabilidade"],["7020400","Consultoria"],["6204000","Tecnologia"],["6821801","Imobiliárias"],["4930202","Transportadoras"],["4781400","Vestuário"],["5611201","Restaurantes"],["8630503","Clínicas"]];
  const app={mode:"sector",city:"São Paulo",uf:"SP",neighborhood:"Tatuapé",bairro:"",radius:3,cnae:"",porte:"ME,EPP",capitalBand:"all",order:"xp_fit",page:1,firstPage:1,pages:1,advanced:false,term:"",items:[],total:0,loading:false,searched:false,error:"",notice:"",checkedBairro:0};
  const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const digits=v=>String(v??"").replace(/\D/g,"");
  const ico=(name)=>h.ic(name,16);
  const button=(label,action,id="",kind="button-subtle")=>`<button class="button ${kind}" type="button" data-action="${action}" ${id?`data-cnpj="${safe(id)}" data-id="${safe(id)}"`:""}>${label}</button>`;
  const linked=x=>h.state.leads.find(l=>x.cnpj&&l.cnpj===x.cnpj);
  const touched=l=>!!l&&(["Em conversa","Reunião agendada","Proposta","Convertido"].includes(l.stage)||h.state.events.some(e=>e.lead_id===l.id&&e.kind==="Contato confirmado"));
  const score=x=>CNPJ.xpFit(x);
  const order=()=>[...app.items].sort((a,b)=>app.order==="capital_asc"?Number(a.capital_social||0)-Number(b.capital_social||0):app.order==="razao_asc"?String(a.razao_social||a.company_name).localeCompare(String(b.razao_social||b.company_name),"pt-BR"):(score(b).score??-1)-(score(a).score??-1));
  const badge=x=>{const l=linked(x);return !l?'<span class="chip dim">Novo</span>':touched(l)?'<span class="chip green">Contatado</span>':l.stage==="Sem interesse"?'<span class="chip red">Sem interesse</span>':'<span class="chip blue">Salvo</span>';};
  function form(){
    const opt=(value,label)=>`<option value="${value}" ${app.mode===value?"selected":""}>${label}</option>`;
    const field=(name,label,body,show=true)=>`<div class="field" data-capture-field="${name}" ${show?"":'style="display:none"'}><label>${label}</label>${body}</div>`;
    return `<section class="panel prospect-search"><div class="prospect-search-title"><div><span class="eyebrow">GELZ / BUSINESS INTELLIGENCE</span><h2>${ico("search")} Buscar CNPJ e empresas</h2></div><span class="chip blue">${ico("shield")} Dados públicos</span></div>
      <form id="capture-form" class="prospect-form">
      ${field("mode","Tipo de pesquisa",`<select name="mode" id="capture-mode">${opt("sector","Por segmento")}${opt("cnpj","Pelo CNPJ")}${opt("name","Pelo nome")}${opt("radius","Por raio (km)")}</select>`)}
      ${field("cnpj","CNPJ",`<input name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00" value="${app.mode==="cnpj"?safe(app.term):""}">`,app.mode==="cnpj")}
      ${field("name","Empresa",`<input name="name" placeholder="Nome fantasia ou razão social" value="${app.mode==="name"?safe(app.term):""}">`,app.mode==="name")}
      ${field("sector","Segmento",`<select name="cnae"><option value="" ${app.cnae===""?"selected":""}>Todos os segmentos</option>${segments.map(([v,n])=>`<option value="${v}" ${app.cnae===v?"selected":""}>${n}</option>`).join("")}</select>`,(app.mode==="sector"||app.mode==="radius"))}
      ${field("city","Cidade",`<input name="city" value="${safe(app.city)}">`,app.mode!=="cnpj")}
      ${field("uf","UF",`<select name="uf">${["SP","RJ","MG","SC","PR","RS","BA","GO","PE","DF","ES","CE"].map(v=>`<option ${app.uf===v?"selected":""}>${v}</option>`).join("")}</select>`,app.mode!=="cnpj")}
      ${field("neighborhood","Bairro / ponto",`<input name="neighborhood" value="${safe(app.neighborhood)}">`,app.mode==="radius")}
      ${field("radius","Raio",`<select name="radius">${[1,2,3,5,10,15].map(v=>`<option value="${v}" ${app.radius===v?"selected":""}>${v} km</option>`).join("")}</select>`,app.mode==="radius")}

      ${field("bairro","Bairro (página atual)",`<input name="bairro" value="${safe(app.bairro)}" placeholder="Ex.: Tatuapé">`,app.mode==="sector"||app.mode==="name")}
      ${field("porte","Porte",`<select name="porte"><option value="">Todos os portes</option><option value="ME" ${app.porte==="ME"?"selected":""}>Microempresa (ME)</option><option value="EPP" ${app.porte==="EPP"?"selected":""}>Pequena (EPP)</option><option value="ME,EPP" ${app.porte==="ME,EPP"?"selected":""}>ME + EPP</option><option value="Demais" ${app.porte==="Demais"?"selected":""}>Demais</option></select>`,app.mode==="sector")}
      ${field("capitalBand","Capital social",`<select name="capitalBand"><option value="all" ${app.capitalBand==="all"?"selected":""}>Qualquer capital</option><option value="under10k" ${app.capitalBand==="under10k"?"selected":""}>Até R$ 10 mil</option><option value="under50k" ${app.capitalBand==="under50k"?"selected":""}>Até R$ 50 mil</option><option value="under100k" ${app.capitalBand==="under100k"?"selected":""}>Até R$ 100 mil</option><option value="50to200k" ${app.capitalBand==="50to200k"?"selected":""}>R$ 50–200 mil</option><option value="100to500k" ${app.capitalBand==="100to500k"?"selected":""}>R$ 100–500 mil</option><option value="500kto1m" ${app.capitalBand==="500kto1m"?"selected":""}>R$ 500 mil–1 mi</option><option value="over1m" ${app.capitalBand==="over1m"?"selected":""}>Acima de R$ 1 mi</option></select>`,app.mode==="sector")}
      ${field("order","Ordenação",`<select name="order"><option value="xp_fit" ${app.order==="xp_fit"?"selected":""}>Afinidade XP / negócios locais</option><option value="razao_asc" ${app.order==="razao_asc"?"selected":""}>Nome (A–Z)</option><option value="capital_asc" ${app.order==="capital_asc"?"selected":""}>Menor capital</option><option value="capital_desc" ${app.order==="capital_desc"?"selected":""}>Maior capital</option></select>`,app.mode==="sector")}
      <button type="submit" class="button button-primary prospect-cta" ${app.loading?"disabled":""}>${app.loading?ico("refresh")+" Pesquisando...":ico("search")+" Encontrar leads"}</button></form>
      <div class="prospect-hint" id="capture-hint">${hint()}</div></section>`;
  }
  function hint(){return app.mode==="radius"?(window.GELZ_CONFIG?.radiusProviderEnabled?"Busca por raio exato usando fornecedor empresarial autenticado.":"Raio real usando OpenStreetMap: somente empresas com CNPJ mapeado. Cobertura limitada."):(app.mode==="sector"?"Pesquisa por CNAE e cidade, não por distância.":"Consulta real em base pública de CNPJs.");}
  function metrics(){
    const good=app.items.filter(x=>(score(x).score??-1)>=70).length,contacted=h.state.leads.filter(touched).length;
    const list=[["Empresas disponíveis",app.total||app.items.length,"building"],["Exibidas",app.items.length,"sparkles"],["No CRM",h.state.leads.length,"users"],["Contatados",contacted,"phone"]];
    return `<section class="prospect-metrics">${list.map(([label,value,icon])=>`<div class="panel prospect-metric"><span>${safe(label)} ${ico(icon)}</span><strong>${Number(value).toLocaleString("pt-BR")}</strong></div>`).join("")}</section>`;
  }
  function rows(n){
    return order().slice(0,n).map((x,i)=>{
      const s=score(x),saved=linked(x),phone=x.contactHidden?"":(saved?.contact_phone||x.phone||""),contact=phone?`<a class="link mono contact-no" href="tel:${digits(phone)}" title="Ligar para telefone comercial">${safe(phone)}</a>`:"<small class='muted'>Sem contato comercial</small>";
      return `<tr><td><span class="rank-idx">${String((app.mode==="sector"?(app.firstPage-1)*20:0)+i+1).padStart(2,"0")}</span></td><td><a href="#" data-action="capture-detail" data-id="${safe(x.cnpj)}" class="result-name link">${safe(x.company_name)}</a><small>${safe([x.neighborhood,x.city,x.uf].filter(Boolean).join(" • "))}</small></td><td><span class="mono">${safe(x.cnpj)}</span></td><td><span class="prospect-score">${s.score==null?"—":s.score}<small>/100</small></span><small>${safe(s.evidence)}</small></td><td>${badge(x)}<div style="margin-top:5px">${contact}</div></td><td class="result-buttons">${saved?button("Abrir","lead-view",saved.id):button(ico("plus")+" Salvar","capture-save",x.cnpj,"button-primary")}${!x.contactHidden&&CONTACT.normalizeBrazilPhone(x.phone)?button(ico("phone")+" WhatsApp","capture-whatsapp",x.cnpj,"button-green"):""}${button(ico("users")+" Sócios","capture-partners",x.cnpj)}${button(ico("sparkles")+" Analisar","capture-analyze",x.cnpj)}${button(ico("info"),"capture-detail",x.cnpj)}</td></tr>`;
    }).join("");
  }
  function results(n=12){
    return `<section class="panel panel-pad prospect-results"><div class="panel-top"><div><h2 class="panel-title">${ico("chart")} Afinidade comercial XP / PJ <span class="badge-number">${app.items.length}</span></h2><p class="panel-sub">${app.loading?"Consultando bases públicas...":app.searched?`${app.items.length} carregadas • ${app.total.toLocaleString("pt-BR")} na base${app.mode==="sector"?" • "+(app.firstPage===app.page?"Página "+app.page:"Páginas "+app.firstPage+"–"+app.page)+" de "+app.pages:""}`:"Pesquise para ver empresas reais"}</p></div>${app.items.length?`${button(ico("download")+" CSV","capture-export")}${button(ico("plus")+" Salvar visíveis","capture-bulk","","button-primary")}${app.mode==="sector"&&!app.bairro&&app.page<app.pages&&app.items.length<100?button(ico("layers")+" Carregar +80","capture-more"):""}`:""}</div>
    ${app.error?`<div class="warning">${safe(app.error)} <a href="https://fichario.app/api" class="link" target="_blank" rel="noopener noreferrer">Ver API</a></div>`:""}${app.loading?'<div class="loading-stripes"><span></span><span></span><span></span></div>':app.items.length?`<div class="table-scroller"><table class="data-table"><thead><tr><th>#</th><th>Empresa</th><th>CNPJ</th><th>Sinal</th><th>Status / telefone</th><th>Ações</th></tr></thead><tbody>${rows(n)}</tbody></table></div>`:`<div class="prospect-empty">${ico("building")}<strong>${app.searched?"Nenhum CNPJ identificado":"Encontre seu próximo lead"}</strong><small>${app.searched?"Altere a busca ou tente novamente.":"Escolha um segmento ou informe o CNPJ."}</small></div>`}

    ${app.mode==="sector"&&app.searched&&!app.loading? `<nav class="capture-pagination" aria-label="Páginas de empresas">
       <span class="capture-page-caption">${app.firstPage===app.page?"Página":"Páginas"} <strong>${app.firstPage===app.page?app.page:app.firstPage+"–"+app.page}</strong> de <strong>${app.pages}</strong> • ${Math.min(app.total,app.page*20).toLocaleString("pt-BR")} de ${app.total.toLocaleString("pt-BR")} resultados</span>
       <div class="capture-page-actions"><button type="button" class="button button-outline" data-action="capture-page-prev" ${app.page<=1?"disabled":""}>${ico("arrow")} Anterior</button><button type="button" class="button button-primary" data-action="capture-page-next" ${app.page>=app.pages?"disabled":""}>Próxima página ${ico("arrow")}</button></div>
       </nav>` :""}
    <p class="prospect-footnote">Ranking de afinidade comercial para conversar com negócios locais (ME/EPP). Não mede faturamento, patrimônio ou capacidade de investimento. Fonte: <a href="https://fichario.app/api" target="_blank" rel="noopener noreferrer">Fichário</a> / dados abertos da Receita. ${safe(app.notice||"")}</p></section>`;
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
  function home(){return pageHeader(false)+form()+metrics()+results(20)+stats();}
  function discover(){return pageHeader(true)+form()+results(100);}
  function setup(deps){h=deps;}

  const capitalRanges={all:[null,null],under10k:[0,10000],under50k:[0,50000],under100k:[0,100000],"50to200k":[50000,200000],"100to500k":[100000,500000],"500kto1m":[500000,1000000],over1m:[1000000,null]};
  const fold=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  async function loadPage(page=1){
    if(app.loading)return;
    const old={page:app.page,firstPage:app.firstPage,items:app.items,total:app.total,pages:app.pages,notice:app.notice};
    app.page=Math.max(1,Math.min(50,Math.floor(Number(page)||1)));app.firstPage=app.page;
    app.loading=true;app.error="";app.notice="";app.searched=true;app.items=[];h.render();
    try{
      let result;
      if(app.mode==="cnpj")result={items:[await CNPJ.byCNPJ(app.term)],total:1,pages:1};
      else if(app.mode==="name")result=await CNPJ.byName({query:app.term,city:app.city,uf:app.uf});
      else if(app.mode==="sector"){
        const [min,max]=capitalRanges[app.capitalBand]||capitalRanges.all;
        result=await CNPJ.bySector({city:app.city,uf:app.uf,cnae:app.cnae,page:app.page,porte:app.porte,capitalMin:min,capitalMax:max,order:app.order==="xp_fit"?"capital_asc":app.order});
      }else if(window.GELZ_CONFIG?.radiusProviderEnabled&&!h.state.demo&&h.state.client){
        const center=await CNPJ.geocodeCenter({city:app.city,neighborhood:app.neighborhood});
        const {data,error}=await h.state.client.functions.invoke("prospect-enrich",{body:{mode:"radius",latitude:center.latitude,longitude:center.longitude,radiusKm:app.radius,cnae:app.cnae}});
        if(error||data?.error)throw Error(error?.message||data?.error||"Busca geográfica indisponível");
        result={items:(data?.items||[]).map(x=>CNPJ.normalize(x,"API CNPJs / raio")),total:data?.total||0,pages:1,notice:"Resultados dentro do raio fornecido pela API contratada."};
      }else result=await CNPJ.byRadius({city:app.city,neighborhood:app.neighborhood,radiusKm:app.radius});
      app.total=Number(result?.total)||0;
      app.pages=app.mode==="sector"?Math.min(50,Math.max(1,result?.pages||Math.ceil(Math.min(app.total,10000)/20)||1)):1;
      let items=(result?.items||[]).filter(x=>x.verified);
      app.checkedBairro=0;
      if(app.bairro&&(app.mode==="sector"||app.mode==="name")){
        const subset=items.slice(0,20);
        const detailed=await CNPJ.enrich(subset,subset.length);
        app.checkedBairro=detailed.length;
        items=detailed.filter(x=>fold(x.neighborhood).includes(fold(app.bairro)));
        app.notice="Bairro aplicado SOMENTE às "+app.checkedBairro+" empresas conferidas nesta página; não é uma pesquisa exaustiva no bairro. Navegue pelas páginas para ampliar.";
      }else{
        app.notice=result?.notice||"";
        // Detalhes e QSA são consultados sob demanda, evitando requisições lentas em lote.
      }
      app.items=items;
      if(!items.length)h.toast("Nenhuma empresa localizada nesta página com esses filtros.");
    }catch(err){app.page=old.page;app.firstPage=old.firstPage;app.items=old.items;app.total=old.total;app.pages=old.pages;app.notice=old.notice;app.error=(err.message||"Consulta indisponível")+(old.items.length?". Resultados anteriores preservados.":"");h.toast("Consulta: "+app.error,"error");}
    finally{app.loading=false;h.render();}
  }
  async function submit(formElement){
    const f=new FormData(formElement);
    app.mode=String(f.get("mode")||"sector");
    app.city=String(f.get("city")||app.city).trim();
    app.uf=String(f.get("uf")||app.uf).toUpperCase();
    app.neighborhood=String(f.get("neighborhood")||app.neighborhood).trim();
    app.bairro=String(f.get("bairro")||"").trim().slice(0,90);
    app.radius=Number(f.get("radius")||app.radius);
    app.cnae=String(f.get("cnae")||"");
    app.porte=String(f.get("porte")||"");
    app.capitalBand=String(f.get("capitalBand")||"all");
    app.order=String(f.get("order")||"xp_fit");
    app.term=String(f.get(app.mode==="cnpj"?"cnpj":"name")||"").trim();
    app.page=1;app.firstPage=1;app.pages=1;app.total=0;
    await loadPage(1);
  }
  function changeMode(mode){
    app.mode=mode;const el=document.querySelector("#capture-form");if(!el)return;
    el.querySelectorAll("[data-capture-field]").forEach(f=>{const k=f.dataset.captureField;f.style.display=k==="mode"||k===mode||(mode!=="cnpj"&&["city","uf"].includes(k))||(mode==="radius"&&k==="sector")||(["sector","name"].includes(mode)&&k==="bairro")||(mode==="sector"&&["porte","capitalBand","order"].includes(k))?"":"none";});
    const caption=document.querySelector("#capture-hint");if(caption)caption.textContent=hint();
  }

  async function detail(id){
    const existing=app.items.find(x=>x.cnpj===id)||h.state.leads.find(x=>x.cnpj===id);
    if(!existing)return;
    h.openModal(existing.company_name||"Ficha da empresa",'<div class="loading-stripes"><span></span><span></span></div>',"EMPRESA / INFORMAÇÕES CADASTRAIS");
    let fresh=null,error="";
    try{fresh=await CNPJ.byCNPJ(id);}catch(e){error=e.message||"Não foi possível atualizar os dados cadastrais.";}
    const x=fresh?{...existing,...fresh,source:fresh.source}:existing;
    if(fresh)Object.assign(existing,x);
    const panel=document.querySelector("#modal-body");if(!panel)return;
    const number=x.contactHidden?"":(x.phone||x.contact_phone||"");
    const normalized=CONTACT.normalizeBrazilPhone(number);
    const money=Number(x.capital_social||0);
    const moneyStr=money?money.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"Não informado";
    const scoring=score(x);
    const website=secureLink(x.site||x.website);
    const address=[x.street,x.number,x.complement,x.neighborhood,x.city,x.uf].filter(Boolean).join(", ");
    const sourceUrl=secureLink(x.sourceUrl||x.contact_source_url||"https://fichario.app/cnpj/"+id);
    const linkedLead=linked(x);
    panel.innerHTML=`<div class="company-detail-head"><span class="chip blue">${ico("building")} ${safe(id)}</span><span class="chip dim">${safe(x.situacao||"Situação a confirmar")}</span></div>
      ${error?`<div class="warning" style="margin-top:12px">Dados complementares indisponíveis: ${safe(error)}. Mostrando o cadastro já disponível.</div>`:""}
      <div class="prospect-profile">
        <div><small>Porte</small><strong>${safe(x.porte||"Não informado")}</strong></div>
        <div><small>Capital social declarado</small><strong>${safe(moneyStr)}</strong></div>
        <div><small>Afinidade comercial XP/PJ</small><strong>${scoring.score==null?"—":scoring.score+"/100"}</strong></div>
      </div>
      <section class="company-info-grid">
        <div><small>Razão social</small><strong>${safe(x.razao_social||x.company_name)}</strong></div>
        <div><small>CNAE / atividade</small><strong>${safe(x.sector||"Não informado")}</strong></div>
        <div><small>Data de abertura</small><strong>${safe(x.openingDate||"Não informada")}</strong></div>
        <div><small>Natureza jurídica</small><strong>${safe(x.legalNature||"Não informada")}</strong></div>
        <div class="company-info-full"><small>Endereço cadastral</small><strong>${safe(address||"Não informado")}${x.cep?" • CEP "+safe(x.cep):""}</strong></div>
      </section>
      <div class="partner-section-head"><h3>${ico("phone")} Canais comerciais</h3></div>
      <div class="partner-company-contacts">
        <div><small>Telefone da empresa</small><strong>${number?`<a class="link" href="tel:${safe(normalized||number.replace(/\D/g,""))}">${safe(number)}</a>`:"Não divulgado"}</strong></div>
        <div><small>E-mail da empresa</small><strong>${x.contactHidden?"Não divulgado":safe(x.email||x.contact_email||"Não divulgado")}</strong></div>
      </div>
      <div class="button-row">
        ${normalized?button(ico("phone")+" Abrir WhatsApp","capture-whatsapp",id,"button-green"):""}
        ${website?`<a class="button button-outline" href="${safe(website)}" target="_blank" rel="noopener noreferrer">${ico("globe")} Site oficial</a>`:""}
        ${button(ico("users")+" Sócios / responsáveis","capture-partners",id)}${button(ico("sparkles")+" Analisar empresa","capture-analyze",id)}
      </div>
      <div class="info" style="margin-top:15px">Afinidade de abordagem calculada com sinais de empresa ME/EPP e capital cadastral. Não representa patrimônio, renda, saldo nem disposição para investir.</div>
      <p class="prospect-footnote">Fonte: ${x.source? safe(x.source):"Dados empresariais públicos"} • <a class="link" href="${safe(sourceUrl)}" target="_blank" rel="noopener noreferrer">Conferir na fonte</a></p>
      <div class="modal-actions">${linkedLead?button("Abrir no CRM","lead-view",linkedLead.id,"button-primary"):button(ico("plus")+" Salvar no CRM","capture-save",id,"button-primary")}</div>`;
  }

  const secureLink=(link)=>{try{const u=new URL(String(link||""));return ["https:","http:"].includes(u.protocol)?u.toString():"";}catch{return "";}};
  async function partners(id){
    const x=app.items.find(y=>y.cnpj===id)||h.state.leads.find(y=>y.cnpj===id);if(!x)return;
    h.openModal("Sócios e canais de contato",'<div class="loading-stripes"><span></span><span></span></div>',"QUADRO SOCIETÁRIO / RECEITA");
    let result=null,error="";
    try{result=await CNPJ.partners(id);}catch(e){error=e.message||"Não foi possível consultar o quadro societário."; }
    const panel=document.querySelector("#modal-body");if(!panel)return;
    const socios=result?.partners||[];
    const canUsePhone=!x.contactHidden;
    const phone=canUsePhone?(x.phone||result?.corporatePhone||""):"";
    const email=canUsePhone?(x.email||result?.corporateEmail||""):"";
    const website=secureLink(x.site||x.website);
    const corporateWa=canUsePhone?RESEARCH.bareWhatsAppLink(phone):"";
    const confirmedLinkedIn=RESEARCH.cleanVerifiedLinkedIn(x.contact_linkedin_url||"");
    const contactMatch=socios.find(p=>p.name.toLowerCase().trim()===String(x.contact_name||"").toLowerCase().trim());
    panel.innerHTML=`<div class="info">${ico("info")} Nomes e funções registrados no QSA. A lista mostra nomes e funções públicas; os links de LinkedIn são <strong>pesquisas</strong>, nunca perfis atribuídos sem confirmação.</div>
      ${error?`<div class="warning" style="margin-top:12px">${safe(error)}</div>`:""}
      <div class="partner-section-head"><h3>${ico("users")} Sócios / administradores</h3><span class="chip blue">${socios.length} identificado(s)</span></div>
      ${socios.length?socios.map((p,i)=>`<article class="partner-card"><div class="partner-avatar">${ico("users")}</div><div><strong>${safe(p.name)}</strong><small>${safe(p.role)}</small></div><div class="partner-links"><a class="partner-search" target="_blank" rel="noopener noreferrer" href="${safe(confirmedLinkedIn&&contactMatch&&contactMatch.name===p.name?confirmedLinkedIn:RESEARCH.linkedInSearch(p.name,x.company_name))}">${confirmedLinkedIn&&contactMatch&&contactMatch.name===p.name?"LinkedIn confirmado":"Pesquisar LinkedIn"} ↗</a><a class="partner-search" target="_blank" rel="noopener noreferrer" href="${safe(RESEARCH.publicProfessionalSearch(p.name,x.company_name))}">Busca profissional ↗</a></div></article>`).join(""):'<div class="prospect-empty compact">QSA não localizado na fonte consultada. Alguns registros individuais não apresentam quadro societário.</div>'}
      <div class="partner-section-head"><h3>${ico("phone")} Canais comerciais da empresa</h3></div>
      <div class="partner-company-contacts"><div><small>WhatsApp / telefone comercial</small><strong>${corporateWa?`<a class="link mono" href="${safe(corporateWa)}" target="_blank" rel="noopener noreferrer">${safe(corporateWa)}</a>`:safe(phone||"Não divulgado")}</strong></div><div><small>E-mail comercial</small><strong>${safe(email||"Não divulgado")}</strong></div></div><div class="info" style="margin-top:12px">Telefone direto pessoal do sócio: não identificado ou não verificado. Exibimos apenas canais profissionais explicitamente disponíveis; não associamos o número geral da empresa a um sócio.</div>
      ${website?`<a class="link" href="${safe(website)}" target="_blank" rel="noopener noreferrer">Site oficial da empresa ↗</a>`:""}
      <p class="prospect-footnote">Fonte do QSA: BrasilAPI (dados cadastrais da Receita Federal). Os canais divulgados podem ser gerais, não diretos do proprietário. Não extraímos telefones pessoais ocultos nem presumimos autorização para WhatsApp.</p>
      <div class="modal-actions">${button(ico("info")+" Ficha da empresa","capture-detail",id)}</div>`;
  }

  function quickWhats(id){
    const company=app.items.find(x=>x.cnpj===id)||h.state.leads.find(x=>x.cnpj===id);
    if(!company||company.contactHidden)return;
    const phone=company.phone||company.contact_phone||"";
    const name=company.company_name||"sua empresa";
    const advisor=h.state.settings?.advisor_name||"Junior Sousa";
    const institution=h.state.settings?.institution||"Quattro Investimentos";
    const link=CONTACT.whatsappLink(phone,CONTACT.advisorIntro(name,advisor,institution));
    if(!link){h.toast("Telefone sem DDD ou incompleto. Corrija-o antes de abrir o WhatsApp.","error");return;}
    const result=window.open(link,"_blank");
    if(result){try{result.opener=null;}catch{}}else window.location.assign(link);
    h.toast("Conversa individual aberta. Nenhuma mensagem enviada automaticamente.");
  }

  function buildRecord(x){
    const date=new Date().toISOString();
    return {id:crypto.randomUUID(),owner_id:h.state.user?.id||null,
      company_name:x.company_name||x.razao_social||"Empresa",sector:x.sector||"",
      city:x.city||app.city,neighborhood:x.neighborhood||"",cnpj:x.cnpj,
      cnpj_verified:false,cnae:x.cnae||"",place_id:"",source_type:"fichario_cnpj",
      contact_name:"",contact_phone:x.contactHidden?"":CONTACT.normalizeBrazilPhone(x.phone),
      contact_email:x.contactHidden?"":(x.email||""),contact_source_url:x.sourceUrl||"",
      website:x.site||"",opt_in_whatsapp:false,opt_in_evidence:"",stage:"Descoberto",
      notes:"Fonte pública: "+x.source+". Capital social cadastral declarado: "+(x.capital_social||"não informado")+". Não representa saldo, faturamento ou disposição para investir.",
      next_contact_at:null,ai_score:null,ai_analysis:null,created_at:date,updated_at:date
    };
  }
  async function captureVisible(){
    const available=order().filter(x=>x.cnpj&&!linked(x)).slice(0,100);
    if(!available.length){h.toast("Todos os CNPJs desta consulta já estão no CRM.");return;}
    const disclaimer=h.state.demo?" (demonstração: não ficam salvos permanentemente).":"";
    if(!window.confirm("Adicionar "+available.length+" empresas à base de leads"+disclaimer+"?"))return;
    const records=available.map(buildRecord);
    if(!h.state.demo){
      const {error}=await h.state.client.from("prospect_leads").insert(records);
      if(error){h.toast("Erro ao salvar lote: "+error.message,"error");return;}
    }
    h.state.leads.push(...records);
    h.render();
    h.toast(records.length+" empresas adicionadas ao CRM"+(h.state.demo?" nesta sessão de demonstração.":"."));
  }
  async function loadMore(){
    if(app.loading||app.mode!=="sector"||app.bairro){h.toast("A ampliação em lote exige pesquisa por cidade/segmento sem filtro de bairro.","error");return;}
    if(app.page>=app.pages){h.toast("Última página atingida.");return;}
    const [min,max]=capitalRanges[app.capitalBand]||capitalRanges.all;
    const maxExtra=Math.min(4,app.pages-app.page,Math.floor((100-app.items.length)/20));
    if(maxExtra<=0){h.toast("Limite de 100 empresas na tela. Use Próxima página para continuar.");return;}
    app.loading=true;app.error="";h.render();
    const dedup=new Map(app.items.map(x=>[x.cnpj,x]));
    let added=0,stopErr="";
    for(let k=0;k<maxExtra;k++){
      const page=app.page+1;
      try{
        const result=await CNPJ.bySector({city:app.city,uf:app.uf,cnae:app.cnae,page,porte:app.porte,capitalMin:min,capitalMax:max,order:app.order==="xp_fit"?"capital_asc":app.order});
        for(const x of result.items){if(!dedup.has(x.cnpj)){dedup.set(x.cnpj,x);added++;}}
        app.page=page;
        if(page<app.pages)await new Promise(resolve=>setTimeout(resolve,430));
      }catch(err){stopErr=err.message||"Erro na fonte de CNPJ";break;}
    }
    app.items=[...dedup.values()];
    app.loading=false;
    if(stopErr)app.error="Busca interrompida: "+stopErr+". Empresas já carregadas preservadas.";
    h.render();
    h.toast(added+" empresas adicionais carregadas"+(stopErr?" antes da interrupção.":"."));
  }
  async function autoStart(){
    if(app.searched||app.loading)return;
    await loadPage(1);
  }

  async function save(id){
    const x=app.items.find(x=>x.cnpj===id)||h.state.leads.find(x=>x.cnpj===id);
    if(!x)return;
    const existing=linked(x);
    if(existing){h.viewLead(existing.id);return;}
    const record=buildRecord(x);
    if(!h.state.demo){
      const {error}=await h.state.client.from("prospect_leads").insert(record);
      if(error){h.toast("Não foi possível salvar: "+error.message,"error");return;}
    }
    h.state.leads.unshift(record);
    await h.recordEvent(record.id,"Captura","CNPJ cadastrado a partir de fonte empresarial pública.");
    h.closeModal();h.render();
    h.toast("Empresa adicionada ao CRM"+(h.state.demo?" demonstrativo.":"."));
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
    if(name==="capture-detail")await detail(id);
    else if(name==="capture-whatsapp")quickWhats(id);
    else if(name==="capture-analyze")await h.analyzeCompany(id);
    else if(name==="capture-partners")await partners(id);
    else if(name==="capture-save")await save(id);
    else if(name==="capture-export")csv();
    else if(name==="capture-bulk")await captureVisible();
    else if(name==="capture-more")await loadMore();
    else if(name==="capture-page-next")await loadPage(app.page+1);
    else if(name==="capture-page-prev")await loadPage(app.page-1);
    else if(name==="capture-contacted")await contacted(id);
  }

export { setup, home, discover, submit, changeMode, action, autoStart };
