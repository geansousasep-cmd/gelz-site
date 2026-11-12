/* GELZ Prospect: somente identificadores e chaves públicas no navegador.
   Configure os campos antes da publicação. NÃO coloque tokens secretos aqui.
   Supabase: use somente a publishable/anon key. A senha admin NÃO pertence a este arquivo.
   Maps: restrinja a chave HTTP referrer gelz.tech/prospect/* no Google Cloud. */
window.GELZ_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabaseAnonKey: "",
  adminEmail: "",
  radiusProviderEnabled: false, // exige Supabase + PROSPECT_RADIUS_API_KEY privado
  enrichmentEnabled: false,
  contactProviderEnabled: false,
  aiEnabled: false
});
