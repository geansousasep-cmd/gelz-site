/* Contatos comerciais do GELZ Prospect: somente abertura manual de links.
 * Nenhum número é validado como uma conta WhatsApp pelo sistema; isso é verificado pelo próprio WhatsApp.
 * Não há disparo em lote, web scraping de contatos pessoais nem envio automático. */
export function normalizeBrazilPhone(value){
  let v=String(value??"").replace(/\D/g,"");
  if(v.startsWith("00"))v=v.slice(2);
  if(v.startsWith("0")&&v.length>11)v=v.replace(/^0+/,"");
  if(v.length===10||v.length===11)v="55"+v;
  if(!/^55\d{10,11}$/.test(v))return "";
  const ddd=Number(v.slice(2,4));
  return ddd>=11&&ddd<=99?v:"";
}
export function whatsappLink(phone,message=""){
 const number=normalizeBrazilPhone(phone);
 return number?"https://wa.me/"+number+(message?"?text="+encodeURIComponent(String(message).trim()):""):"";
}
export function advisorIntro(company,advisor="Junior Sousa",institution="Quattro Investimentos"){
  const firm=String(company||"sua empresa").trim().slice(0,110);
  return "Olá! Tudo bem? Sou "+String(advisor||"Junior Sousa")+", da "+String(institution||"Quattro Investimentos")+". Gostaria de saber se posso apresentar brevemente nosso atendimento para empresas e conhecer as necessidades da "+firm+". Podemos conversar?";
}
