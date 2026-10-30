import { products } from "./products.js";

const $ = (s) => document.querySelector(s);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const byId = new Map(products.map(p => [p.id, p]));
const safeSaved = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v.filter(x=>typeof x==="string") : []; } catch { return []; } };
const state = {
  category: "Todas", query: "", sort: 0,
  favorites: new Set(safeSaved("gelz-store-favorites")),
  cart: [] // Nenhum checkout é acionado pela vitrine de preparação.
};
const $grid = $("#productGrid"), $status = $("#catalogStatus");
const categories = ["Todas", ...new Set(products.map(x => x.category))];
let toastTimer, lastFocused;

function saveFavorites() {
  try { localStorage.setItem("gelz-store-favorites", JSON.stringify([...state.favorites])); } catch {}
}
function toast(message) {
  const el=$("#toast");
  el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),3000);
}
function updateBodyLock() {
  document.body.classList.toggle("lock", !$("#drawer").hidden || !$("#productDialog").hidden);
  $("#overlay").hidden = $("#drawer").hidden && $("#productDialog").hidden;
}
function openDrawer(title, content) {
  closeDialog(false);
  lastFocused = document.activeElement;
  $("#drawerTitle").textContent = title;
  $("#drawerContent").innerHTML = content;
  $("#drawer").hidden = false;
  updateBodyLock();
  $("#drawer").querySelector(".close-button").focus();
}
function closeDrawer(restore=true) {
  $("#drawer").hidden = true;
  updateBodyLock();
  if(restore && lastFocused?.focus) lastFocused.focus();
}
function closeDialog(restore=true) {
  $("#productDialog").hidden = true;
  updateBodyLock();
  if(restore && lastFocused?.focus) lastFocused.focus();
}
function renderTabs() {
  $("#categories").innerHTML=categories.map(cat=>`<button type="button" data-action="category" data-value="${escapeHTML(cat)}" class="${cat===state.category?"active":""}" aria-pressed="${cat===state.category}">${escapeHTML(cat)}</button>`).join("");
}
function displayedProducts() {
  let list=products.filter(p => (state.category==="Todas"||p.category===state.category) && (
    !state.query || [p.name,p.category,p.description].join(" ").toLocaleLowerCase("pt-BR").includes(state.query.toLocaleLowerCase("pt-BR"))
  ));
  if(state.sort===1) list=[...list].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  if(state.sort===2) list=[...list].sort((a,b)=>b.name.localeCompare(a.name,"pt-BR"));
  return list;
}
function card(p) {
  const available=p.status==="active"&&Number.isFinite(p.price)&&p.price>0&&Number.isInteger(p.inventory)&&p.inventory>0;
  return `<article class="product-card">
    <div class="product-photo">
      <button class="card-photo-button" data-action="detail" data-id="${escapeHTML(p.id)}" aria-label="Ver ${escapeHTML(p.name)}"><img src="${escapeHTML(p.image)}" loading="lazy" alt="${escapeHTML(p.name)}"></button>
      <span class="product-label">${available?"Disponível":"Em preparação"}</span>
      <button type="button" class="fav-btn ${state.favorites.has(p.id)?"saved":""}" data-action="toggleFavorite" data-id="${escapeHTML(p.id)}" aria-label="${state.favorites.has(p.id)?"Remover dos favoritos":"Adicionar aos favoritos"}"><span aria-hidden="true">${state.favorites.has(p.id)?"♥":"♡"}</span></button>
    </div>
    <div class="card-info"><span class="card-category">${escapeHTML(p.category)}</span>
    <h3 class="card-name">${escapeHTML(p.name)}</h3>
    <div class="card-price">${available?money(p.price):"Preço a confirmar"}</div></div>
  </article>`;
}
function render() {
  renderTabs();
  const list=displayedProducts();
  $status.textContent=`${list.length} ${list.length===1?"produto encontrado":"produtos encontrados"} · Catálogo em preparação, sem vendas ativadas`;
  $grid.innerHTML=list.length?list.map(card).join(""):'<div class="empty-state">Não encontramos produtos com esses filtros.</div>';
  $("#cartCount").textContent=String(state.cart.length);
  $("#sortButton").textContent=["Ordenar: Destaques ↕","Ordenar: A–Z ↕","Ordenar: Z–A ↕"][state.sort];
}
function showFavorites() {
  const list=products.filter(p=>state.favorites.has(p.id));
  openDrawer("Meus favoritos", list.length ? `
    <p class="drawer-note">Suas escolhas ficam salvas neste navegador.</p>
    ${list.map(p=>`<div class="drawer-line"><img src="${escapeHTML(p.image)}" alt=""><div><strong>${escapeHTML(p.name)}</strong><p>Em preparação</p><button data-action="removeFavorite" data-id="${escapeHTML(p.id)}">Remover</button></div></div>`).join("")}`
    : '<p class="drawer-note">Sua lista de favoritos está vazia. Toque no coração de um produto para salvá-lo.</p>');
}
function showCart() {
  openDrawer("Sua sacola", '<p class="drawer-note">O checkout da Gelz Store ainda não está conectado ao banco de dados, pagamentos e fretes. A compra será liberada depois da validação dos produtos e dos testes de segurança.</p><div class="drawer-bottom"><button class="checkout-disabled" disabled>CHECKOUT EM PREPARAÇÃO</button></div>');
}
function showAccount() {
  openDrawer("Minha conta", '<p class="drawer-note">Cadastro, login e histórico de pedidos serão disponibilizados quando a autenticação segura do backend estiver configurada. Não insira dados pessoais nesta versão de preparação.</p>');
}
function detail(id) {
  const p=byId.get(id); if(!p)return;
  lastFocused=document.activeElement;closeDrawer(false);
  const available=p.status==="active"&&Number.isFinite(p.price)&&p.price>0&&Number.isInteger(p.inventory)&&p.inventory>0;
  $("#dialogContent").innerHTML=`<div class="product-detail">
    <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
    <div class="detail-copy"><span class="eyebrow">${escapeHTML(p.category)} · GELZ STORE</span>
      <h2 id="dialogTitle">${escapeHTML(p.name)}</h2>
      <p>${escapeHTML(p.description)}</p>
      <strong>${available?money(p.price):"Preço a confirmar"}</strong>
      <div class="detail-options">${(p.colors||[]).map(c=>`<span>${escapeHTML(c)}</span>`).join("")}</div>
      ${(p.sizes||[]).length?`<p>Tamanhos informados anteriormente: ${escapeHTML(p.sizes.join(", "))} (a confirmar no estoque).</p>`:""}
      <button class="checkout-disabled" type="button" disabled>COMPRAS AINDA NÃO DISPONÍVEIS</button>
      <p class="detail-note">Antes de habilitar pedidos, validaremos os preços, o estoque, os tamanhos, a entrega e o pagamento.</p>
    </div></div>`;
  $("#productDialog").hidden=false;updateBodyLock();$("#productDialog").querySelector(".dialog-close").focus();
}
function search() {
  closeDrawer(false);closeDialog(false);
  $("#searchBox").hidden=false;
  document.querySelector("#colecao").scrollIntoView({behavior:"smooth"});
  $("#searchInput").focus({preventScroll:true});
}
function switchMenu() {
  const el=$("#mobileMenu");el.hidden=!el.hidden;
  $('[data-action="menu"]').setAttribute("aria-expanded",String(!el.hidden));
}
document.addEventListener("click", event=>{
  const btn=event.target.closest("[data-action]"); if(!btn) return;
  const action=btn.dataset.action, id=btn.dataset.id;
  if(action==="menu")switchMenu();
  if(action==="search")search();
  if(action==="favorites")showFavorites();
  if(action==="cart")showCart();
  if(action==="account")showAccount();
  if(action==="closeDrawer")closeDrawer();
  if(action==="closeDialog")closeDialog();
  if(action==="category"){state.category=btn.dataset.value;render();}
  if(action==="sort"){state.sort=(state.sort+1)%3;render();}
  if(action==="detail")detail(id);
  if(action==="toggleFavorite"||action==="removeFavorite"){
    if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
    saveFavorites();render();
    if(action==="removeFavorite")showFavorites();else toast(state.favorites.has(id)?"Salvo nos favoritos":"Removido dos favoritos");
  }
  if(action==="clearSearch"){$("#searchInput").value="";state.query="";render();$("#searchInput").focus();}
});
$("#searchInput").addEventListener("input",e=>{state.query=e.target.value.trim();render();});
$("#overlay").addEventListener("click",()=>{closeDrawer(false);closeDialog(false);});
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  if(!$("#drawer").hidden)closeDrawer();
  if(!$("#productDialog").hidden)closeDialog();
  if(!$("#mobileMenu").hidden)switchMenu();
});
$("#mobileMenu").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{if(!$("#mobileMenu").hidden)switchMenu();}));
$("#year").textContent=String(new Date().getFullYear());
render();
