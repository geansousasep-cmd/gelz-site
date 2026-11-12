# GELZ Prospect — CNPJ-first Financial Intelligence

**Produção:** https://gelz.tech/prospect/  
**Repositório:** geansousasep-cmd/gelz-site  
**Stack:** GitHub Pages (frontend estático), Supabase Auth/PostgreSQL/Edge Functions (opcional para produção real) e fontes públicas de CNPJ.

## O que já funciona sem chave paga

- Busca de **CNPJ exato**, com verificação de dígitos e consulta à base pública do Fichário (fallback OpenCNPJ).
- Busca empresarial por **nome, UF/cidade e CNAE**. Base cadastral gratuita do Fichário, sujeita a limites de uso e disponibilidade.
- Dados de empresa retornados pela fonte: nome fantasia, razão social, CNPJ, atividade, porte, capital social declarado, cidade e telefone comercial **quando divulgado e permitido**. Não confundir capital social com faturamento.
- Pesquisa por **raio real em quilômetros** usando OpenStreetMap/Nominatim/Overpass, limitada a estabelecimentos que têm um CNPJ explicitamente informado no mapa; esta modalidade **não é exaustiva** e pode retornar poucos resultados.
- Ranking por **sinais comerciais cadastrais** (porte e capital declarado), não por patrimônios, caixa, capacidade de investimento ou renda estimada.
- Cadastro de CNPJ no CRM, histórico, status, funil, tarefas, exportação CSV, botão WhatsApp com revisão e autorização, e gráficos.
- Navegação por sidebar no computador e pelo menu no celular, testada em Chrome headless.

Os limites do Fichário podem mudar. Documentação: https://fichario.app/api . Termos: https://fichario.app/termos . API pública atual de leitura aceita CORS (testada com origem gelz.tech). O provedor pode suspender acesso ou alterar limites.

**IMPORTANTE:** quando não há Supabase configurado, `admin/admin` abre somente uma **demonstração sem login privado e sem persistência segura de leads**. A pesquisa externa usa empresas reais, mas o CRM demonstrativo é temporário. **Não cadastre dados pessoais ou comerciais sigilosos nele.**

## Atualização: WhatsApp individual, fichas e empresas locais

- **WhatsApp sem etapa bloqueada:** botões `Abrir WhatsApp` nas fichas do CRM e nos resultados de CNPJ usam link individual `https://wa.me/55DDDNUMERO?text=...`, com número brasileiro validado e mensagem de apresentação. Abrem a conversa imediatamente; o usuário revisa/envia **manualmente**. O CRM registra só que o link foi aberto, nunca presume envio, resposta ou autorização.
- **Mensagem editável** disponível como opção separada. O bloqueio visual por ausência de opt-in foi retirado da **abertura manual do link**; isso NÃO equivale a permissão de marketing ou autorização para envios comerciais. Respeitar consentimento aplicável, preferências, LGPD e política da plataforma.
- **Ficha completa por CNPJ:** atualiza sob demanda via fonte pública e mostra razão social, CNAE, endereço, abertura, natureza jurídica, situação, telefone/e-mail comerciais e documentação de origem. Campos indisponíveis são exibidos como não informados.
- **Prioridade comercial para pequenas e médias:** padrão de busca por `ME + EPP`, ordenando na fonte por capital social ascendente; dentro da página, mostra índice de afinidade de abordagem PJ baseado em porte, capital declarado e existência de canal comercial. Índice é heurístico de *relacionamento comercial*, NÃO estimativa de patrimônio/capacidade de investir.
- **Mais empresas na tela:** botão `Carregar +80` consulta até 4 páginas adicionais de 20 resultados (máximo 100 carregadas por visualização) com intervalo entre páginas, sem contornar limites da API. Para avançar, pode usar `Próxima página`.
- **Salvar visíveis:** captura até 100 empresas de uma só vez para o CRM, sem duplicatas e sem disparar WhatsApp. No modo sem Supabase, a captura é **temporária e não persiste após fechar**.
- **Pesquisa inicial automática** por empresas ME/EPP de São Paulo, sem lista inventada: os resultados são obtidos diretamente pela API pública e dependem da sua disponibilidade.

Os termos da fonte pública proíbem raspagem em massa, revenda, telemarketing abusivo e tentativas de contornar limites. A ferramenta não realiza scraping indiscriminado, não envia mensagens automáticas nem oferece números pessoais ocultos.

## Novidades: base maior, bairros e sócios (novembro de 2026)

- A busca `Cidade / segmento` agora aceita **Todos os segmentos**, e o padrão não prioriza empresas de grande capital.
- **Paginação real:** a fonte envia 20 empresas por página; os controles `Anterior` e `Próxima página` chegam a até **50 páginas** (no máximo 1.000 listagens navegáveis por consulta, sujeitas ao limite/documentação da API). Uma página não é a base de dados inteira.
- **Filtros:** porte (ME, EPP, ME+EPP, demais), faixa de capital social declarada, ordenação por nome/menor/maior capital.
- **Bairro:** o Fichário não filtra bairros no endpoint público de listagem. Quando um bairro é informado, a aplicação consulta os detalhes de até 20 CNPJs da página atual e filtra aqueles cujo bairro cadastral corresponde. A contagem total permanece referente à cidade e CNAE, **não ao bairro**. Para cobertura completa por bairro é necessário contratar uma API que aceite `bairro` com `municipio` (ex.: fornecedor com busca B2B), hospedar o acesso em backend e usar o token somente no servidor.
- **Sócios e administradores (QSA):** clique no botão de pessoas na tabela ou dentro da ficha do lead. Consulta pública BrasilAPI (dados Receita), mostrando apenas nome e qualificação. Não mostra CPF, endereço particular ou telefone pessoal. QSA pode estar ausente em registros individuais ou por indisponibilidade de origem.
- **Contato comercial:** exibe o telefone e e-mail empresariais publicamente divulgados, quando disponíveis. O dado **não comprova contato direto do sócio**. Há um link para pesquisar presença profissional pública sem extração automática de números pessoais.
- **Uso consciente da API gratuita:** consulte uma página por vez, evite coleta massiva; o filtro por bairro demanda consultas adicionais e pode sofrer limites de requisições.
- **CRM:** fichas capturadas também possuem botão para consultar sócios. Nada disso substitui a necessidade de Supabase para dados persistentes e login privado.

## 1. Login privado + CRM persistente

GitHub Pages não executa backend de autenticação.

1. Crie uma conta/projeto próprio no Supabase.
2. Execute `prospect/supabase/schema.sql` no SQL Editor.
3. Desative cadastro público no Supabase Auth.
4. Crie um único administrador no Auth com **senha temporária forte aleatória**, nunca `admin/admin` em produção.
5. Insira o UUID do usuário em `public.prospect_admins` conforme SQL; o login público continua exibindo nome `admin`.
6. Configure os 3 campos públicos do `prospect/config.js`: `supabaseUrl`, `supabaseAnonKey` e `adminEmail`.
7. Teste troca obrigatória de senha e RLS de todas as tabelas. Só usuários autorizados podem consultar CRM persistente.

Não colocar senha, token privado ou chave service_role no GitHub.

## 2. Raio exato com cobertura ampla — requer autorização

A busca OSM gratuita serve para casos em que o CNPJ está cadastrado no mapa. Para buscar empresas no raio definido de **1, 2, 3, 5, 10 ou 15 km com cobertura empresarial**, há adaptador pronto na Edge Function `prospect-enrich` para:

```text
POST https://api.apicnpjs.com.br/v1/cnpj/search/location
Authorization: Bearer TOKEN_PRIVADO
{
  "latitude": -23.55,
  "longitude": -46.63,
  "raio_km": 3,
  "cnae": "6920601",
  "page": 1,
  "page_size": 30
}
```

Referência da documentação do fornecedor: https://site.apicnpjs.com.br/documentacao

**O serviço exige contratar/obter token.** Não foi contratado nem configurado; nenhuma cobrança foi autorizada. Para ativar:

1. Contrate um plano compatível com a busca por raio no provedor.
2. No painel do Supabase Edge Functions, salve o segredo `PROSPECT_RADIUS_API_KEY`, **nunca** no arquivo `config.js`.
3. Implante `prospect/supabase/functions/prospect-enrich/index.ts`.
4. Depois de validar uma consulta real, configure `radiusProviderEnabled: true` em `prospect/config.js`.
5. A aplicação usa endereço/bairro para obter coordenadas (Nominatim), passa lat/lon e raio à Edge Function e lista CNPJs retornados.

**Sem ativação:** a modalidade de raio usa OpenStreetMap com aviso de cobertura limitada. Não apresenta busca por cidade como se fosse raio exato.

## 3. Funções adicionais opcionais

- `prospect-enrich`: consulta CNPJ BrasilAPI, fornecedor de nomes empresariais, fornecedor de contatos licenciados e raio comercial.
- `prospect-analyze`: análise IA com `OPENAI_API_KEY` no backend. Não inferir faturamento, lucro, patrimônio ou capacidade financeira.
- `PROSPECT_CNPJ_SEARCH_ENDPOINT`, `PROSPECT_CNPJ_PROVIDER_KEY`, `PROSPECT_CONTACT_ENDPOINT`, `PROSPECT_CONTACT_PROVIDER_KEY`: integrações opcionais de fornecedores licenciados.
- Configuração pública do frontend: `prospect/config.js`.
- Supabase CLI:
  ```bash
  supabase login
  supabase link --project-ref SEU_PROJECT_REF
  supabase functions deploy prospect-enrich
  supabase functions deploy prospect-analyze
  ```

O painel mostra quais integrações estão pendentes.

## 4. WhatsApp e histórico de contato

- Telefones vêm apenas de informações comerciais permitidas, quando disponíveis.
- Número **público não é automaticamente autorização para receber mensagens de marketing por WhatsApp**.
- `Conversar no WhatsApp`: link individual com mensagem editável, aberto somente quando há autorização documentada no CRM.
- Abrir WhatsApp **não significa** que alguém foi contatado; o evento registra apenas abertura do link.
- Marque **Já contatei** manualmente quando houve contato de fato. O indicador da página inicial reflete essa confirmação.
- Nenhum envio em massa ou coleta de celulares privados por bots.

## 5. Indicadores do painel

- `CNPJs encontrados`: registros retornados e verificados na pesquisa atual.
- `Em destaque`: pontuação cadastral ≥70, baseada em dados públicos; não comprova dinheiro ou faturamento.
- `Salvos no CRM`: empresas cadastradas.
- `Contatados`: contatos confirmados manualmente ou leads em estágios avançados.
- Gráfico de etapas: distribuição dos registros salvos.

## 6. Testes e publicação

```bash
node --check prospect/assets/app.js
node --check prospect/assets/capture.js
node --check prospect/assets/cnpj-engine.js
node --test prospect/tests/smoke.test.mjs prospect/tests/capture.test.mjs
node prospect/tests/browser-smoke.mjs
```

O teste de navegador precisa de Chrome/Chromium, Python 3 e rede; ele abre o site local, testa a sidebar, faz consulta CNPJ pública e salva lead na demo.

CI: `.github/workflows/prospect-ci.yml` (testes unitários, navegador e fonte pública).

O workflow existente `.github/workflows/gelz-pages.yml` publica `main` em `gelz.tech`. O Prospect fica em `/prospect/` sem alterar a GELZ Store. Use pull request e confirme CI antes do merge.

## Transparência

- As fontes cadastrais podem ter defasagem ou campos faltantes.
- Nome parecido **não basta** para identificar CNPJ; a pesquisa por nome lista candidatos. O usuário confirma o registro.
- “Capital social” é capital declarado em registro público, **não** receita, lucro, valor patrimonial ou dinheiro disponível.
- CNPJ de MEI/empresário individual pode incluir nome de pessoa física; fornecedores públicos redigem contatos particulares, e o sistema respeita o campo `contato_oculto`.
- Precisão geográfica e cobertura dependem da fonte escolhida.
- Respeite a LGPD, termos de API, políticas do WhatsApp e compliance da instituição financeira.
