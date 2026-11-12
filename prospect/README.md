# GELZ Prospect — Financial Intelligence

Aplicativo privado de prospecção B2B em **/prospect/** do domínio **gelz.tech**. Design GELZ/Apple/Windows/fintech, em português, responsivo. Front-end sem build (HTML, CSS e JavaScript moderno), com backend previsto em Supabase PostgreSQL + Edge Functions.

> **ESTADO ATUAL: branch de homologação.** Não conectado a banco, Google Maps, API de IA nem fornecedores de enriquecimento. A interface abre um **modo de demonstração com empresas explicitamente fictícias** enquanto não houver configuração. NÃO publicar em produção como sistema operacional até concluir as etapas e os testes abaixo.

## O que está implementado

- Login privado pelo Supabase Auth e cadastro permitido somente ao administrador registrado em `prospect_admins`.
- Usuário visível: **admin**. A senha é validada exclusivamente no Supabase; **NUNCA** há senha no repositório.
- Bloqueio de operações do CRM por RLS até a senha temporária ter sido substituída. Função de trigger no banco detecta troca real de senha.
- Dashboard, métricas, design premium, responsividade, tabelas, menu, busca global Ctrl/⌘+K, modais e notificações.
- CRM CRUD, deduplicação por CNPJ/Place ID, funil Kanban, histórico, tarefas, relatórios, CSV e impressão para PDF.
- Google Maps dentro do painel e Google Places Text Search/Place Details, ao configurar API.
- Persistência no CRM apenas do Place ID da fonte Google; dados exibidos em tempo real não são automaticamente gravados.
- Consulta e validação CNPJ (por número via BrasilAPI); correspondência por nome via fornecedor contratado, com seleção manual.
- Consulta de contatos **comerciais** via fornecedor licenciado, com indicação de fonte e sem persistência automática.
- Análise de potencial **comercial**, com IA no servidor; sem inferir patrimônio, caixa, lucro, faturamento ou capacidade de investimento.
- WhatsApp individual `wa.me`, prévia/editável, somente quando há número válido e autorização registrada; **não dispara mensagens**.
- Integrações exibem estado pendente, em vez de simular pesquisa real.
- Modo de demonstração opcional, SEM acesso a dados reais e SEM autenticação de produção.

## Arquitetura

```text
gelz.tech/prospect/        GitHub Pages: HTML/CSS/JS estático
              │
              ├── Supabase Auth + Postgres (RLS)
              ├── Google Maps JavaScript + Places API (New)
              ├── Supabase Edge Function prospect-enrich
              │       ├── BrasilAPI CNPJ por número
              │       ├── provedor comercial opcional por nome
              │       └── provedor licenciado de contatos opcionais
              └── Supabase Edge Function prospect-analyze
                      └── OpenAI API (token somente no servidor)
```

GitHub Pages não executa código de servidor, não autentica usuários e não armazena segredos. **Não usar credenciais privadas em `config.js`**. Somente chave pública restrita do Google Maps e chave publicável/anon do Supabase são adequadas ali.

## 1. Banco, autenticação e segurança (necessário)

1. Crie um projeto **Supabase dedicado** ao GELZ Prospect.
2. Execute o SQL completo em `supabase/schema.sql` no SQL Editor.
3. Em **Authentication > Providers**, desative cadastro público. Não permita registro anônimo. Configure o envio de email do Auth, se necessário.
4. Crie um usuário único no Auth com email que você controla. A tela do site continuará exibindo o **username `admin`**. Não use o e-mail de contato público como senha ou identificador de segurança.
5. **Senha:** o pedido original especifica `admin/admin`. Esta combinação é insegura e não é provisionada automaticamente. Se precisar reproduzi-la, faça SOMENTE em ambiente local isolado sem dados reais e troque imediatamente. Na hospedagem pública, crie uma **senha temporária aleatória e forte**; a aplicação exige sua troca no primeiro login.
6. Registre o UUID do usuário em `public.prospect_admins` seguindo o comando ao final de `schema.sql` (substitua o email).
7. Confirme `must_change_password=true` antes do primeiro acesso.
8. Atualize `config.js`: `supabaseUrl`, `supabaseAnonKey` (chave **publicável/anon**, NÃO `service_role`) e `adminEmail`.
9. A aplicação só permite operar depois de validação Auth + cadastro `prospect_admins`; as tabelas só permitem operações após mudança da senha. Revise os logs e a configuração de RLS no dashboard.

O nome de usuário `admin` é único e fixo. Não existe cadastro público ou opção de registrar contas adicionais pela interface.

## 2. Google Maps integrado (necessário)

1. No Google Cloud, crie projeto com faturamento e quotas de gastos.
2. Habilite **Maps JavaScript API**, **Places API (New)** e **Geocoding API**.
3. Gere chave para navegador e restrinja a origem HTTP para `https://gelz.tech/*` e, se usar, `https://www.gelz.tech/*`. Restrinja também a chave às APIs estritamente usadas.
4. Preencha `googleMapsKey` em `config.js`. **Não habilite serviços adicionais além do necessário**.
5. Teste geocodificação, busca por segmento e detalhes de um lugar, no navegador, observando a cobrança.

O Google Places **não fornece CNPJ**. O nome, endereço, telefone e site são mostrados sob demanda; o CRM armazena apenas o `place_id` e eventuais dados empresariais declarados manualmente ou provenientes de fontes independentes licenciadas. Respeite atribuição ao Google e os termos para uso/caching.

Referências:
- https://developers.google.com/maps/documentation/javascript/place-search
- https://developers.google.com/maps/documentation/javascript/reference/place
- https://developers.google.com/maps/documentation/places/web-service/policies

## 3. Deploy das Edge Functions

Os arquivos estão em:
- `supabase/functions/prospect-enrich/index.ts`
- `supabase/functions/prospect-analyze/index.ts`

Implante usando Supabase CLI em um projeto Supabase autorizado. Em um projeto local Supabase, copie a pasta `functions` para `supabase/functions` e execute:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy prospect-enrich
supabase functions deploy prospect-analyze
```

Os endpoints são autenticados e validam a conta admin no banco. Configure os segredos pelo dashboard ou CLI, **nunca no GitHub**:

```text
OPENAI_API_KEY=...                  (somente backend)
OPENAI_MODEL=gpt-4.1-mini          (ajuste conforme modelo acessível)
PROSPECT_CNPJ_SEARCH_ENDPOINT=...  (opcional: fornecedor por nome)
PROSPECT_CNPJ_PROVIDER_KEY=...     (opcional)
PROSPECT_CONTACT_ENDPOINT=...      (opcional: contatos comerciais licenciados)
PROSPECT_CONTACT_PROVIDER_KEY=...  (opcional)
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` são disponibilizadas automaticamente em muitos ambientes Supabase; confirme no ambiente da função.

Depois de testar cada função com uma sessão autenticada, habilite em `config.js`: `enrichmentEnabled`, `contactProviderEnabled` e `aiEnabled` conforme integrações realmente conectadas. Esses valores são sinalizadores de interface, não prova de conectividade.

**Contratos de integração opcionais (POST JSON):**
- `PROSPECT_CNPJ_SEARCH_ENDPOINT`: recebe `{companyName,city,cnpj}` e retorna `{candidates:[{cnpj,razao_social,nome,municipio,uf,source}]}`. O usuário escolhe e valida o registro.
- `PROSPECT_CONTACT_ENDPOINT`: recebe `{companyName,city,cnpj}` e retorna `{contacts:[{value,contactType:"commercial",channel,source}]}`. Nenhum dado de pessoa privada deve ser enviado.

Somente obtenha e use contatos empresariais conforme contrato do fornecedor, legislação e autorização de comunicação.

## 4. Configuração da identidade

No painel `Configurações`, personalize nome do assessor, instituição e assinatura. Antes do uso comercial, valide a identidade profissional e mensagens com o compliance da instituição e as normas aplicáveis da CVM.

## 5. Publicação no gelz.tech

O repositório `geansousasep-cmd/gelz-site` já possui:
- `CNAME` apontando para `gelz.tech`;
- workflow de publicação GitHub Pages em `main`.

Os arquivos do Prospect foram criados na branch `feature/gelz-prospect-premium` sem editar a loja principal. Faça os testes e configuração **antes de mesclar a PR**. Ao mesclar e após o workflow Pages passar, a rota prevista é `https://gelz.tech/prospect/`. Publicar frontend sem Supabase mostra apenas o painel de instalação e demonstração fictícia.

## 6. Verificações antes de produção

- [ ] Autenticação real funciona apenas para admin.
- [ ] Tentativa de usar `admin/admin` em produção não funciona.
- [ ] Troca de senha ativa acesso; sem troca, RLS nega dados.
- [ ] Sessão expira, logout funciona, refresh mantém login quando permitido.
- [ ] Conta desconhecida não acessa CRM e RLS nega consultas.
- [ ] Banco sem usuários de demonstração.
- [ ] Maps carrega com chave restrita e Places faturado com quotas.
- [ ] Busca por bairro mostra empresas reais e mapa.
- [ ] Captura não grava conteúdo sujeito a restrições Google.
- [ ] CNPJ inválido é recusado e correspondência é confirmada.
- [ ] Contatos vêm somente de fornecedores licenciados e fontes verificáveis.
- [ ] Mensagens WhatsApp só abrem com autorização registrada.
- [ ] IA não inventa informações financeiras ou pontuação com dados insuficientes.
- [ ] CSV importado não herda consentimento WhatsApp.
- [ ] CRUD, pipeline, agenda, exportação e edição funcionam em mobile e desktop.
- [ ] Criptografia em trânsito; logs sem tokens ou dados sensíveis.
- [ ] Quotas e limites de APIs definidos; orçamento monitorado.
- [ ] Plano de backups, exclusão e retenção de dados aprovado.
- [ ] Compliance Quattro/XP revisou fluxos e mensagens.
- [ ] Site GELZ Store continua funcionando como antes.

## 7. Desenvolvimento local

Qualquer servidor estático é suficiente para a interface, por exemplo:

```bash
cd prospect
python -m http.server 8000
```

Abra `http://localhost:8000` para a interface. Sem credenciais, utilize **admin / admin** somente para entrar na **demonstração fictícia** ou clique em **Explorar demonstração fictícia**. Não existe autenticação privada nesse modo e nenhum dado real é carregado. Não cadastre dados reais na demonstração.

## Limitações atuais — não ocultar

Não é possível habilitar funcionalidades externas reais **sem** as contas, chaves, quotas, fornecedor autorizado e configuração de backend pelo proprietário. Não é possível inferir faturamento ou patrimônio a partir de CNPJ. Telefone público não implica autorização para mensagens pelo WhatsApp. A versão em branch está preparada, mas **não está publicada em gelz.tech**.
