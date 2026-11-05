# GELZ Store — implantação e estado verificável (05/11/2026)

**Esta entrega contém código executável e testes locais. Não representa uma operação pronta para vendas reais.**
O frontend continua no GitHub Pages. Cloudflare Worker/D1/R2, Supabase Auth e provedores precisam ser conectados. Nenhuma credencial privada foi inserida neste repositório. `commerce-config.js` permanece sem API, e o checkout fica bloqueado.

## Arquitetura e mudanças

- Vitrine e páginas existentes preservadas. Mudanças concentradas em `store/`; CI em `.github/workflows/commerce-tests.yml`.
- D1 guarda produtos, SKUs, pedidos, cupons, clientes, endereços, favoritos, auditoria, reservas, envios e fila de e-mail.
- Supabase usado somente para autenticação: cadastro, confirmação, login, recuperação e logout. O servidor consulta `/auth/v1/user`; permissões administrativas vêm da tabela D1 `administrators`, nunca de `user_metadata`.
- R2 opcional para imagens. Upload autenticado de PNG/JPEG/WebP, até 5 MB, validação da assinatura binária e resposta com `nosniff`. Sem SVG/HTML.
- `/store/admin/`: métricas, gráfico de 30 dias, pedidos, clientes, produtos/SKUs, uploads, cupons, CSV, auditoria, preparação de envios, rastreio manual e etiquetas sandbox vinculadas.
- `/store/account/`: autenticação, perfil, endereços, favoritos e pedidos da conta. Pedidos de visitante usam um segredo aleatório, armazenado como hash no servidor, e link privado em `/store/order.html`.
- Mercado Pago Payment Brick com Pix/cartões e condições de parcelamento do provedor. O total é recalculado pelo servidor; não se armazenam PAN/CVV ou token de cartão.
- Checkout idempotente por tentativa; payload diferente com a mesma chave retorna conflito. Uma tentativa financeira por pedido e chave fixa no provedor. Timeouts preservam a reserva até reconciliação, sem assumir que falhou.
- Reserva atômica em triggers SQL: falha de qualquer SKU aborta o batch completo. Webhook repetido não baixa estoque duas vezes. Pedidos `pending` expiram em 30 minutos; `paying` precisam de confirmação do provedor.
- Cotação Melhor Envio no servidor e modalidade guardada no pedido. Preparação de envio e geração/impressão privada/consulta de etiquetas existentes, exclusivamente sandbox. A compra automática de etiquetas **não está implementada**.
- Resend com outbox e chave idempotente. Desativado por padrão. Mensagens de cadastro/recuperação dependem do SMTP do Supabase.
- Página informativa com CNPJ e seções de privacidade, termos e devoluções. Razão social/endereço/retencão e procedimento operacional ainda precisam ser confirmados.

## Auditoria do código anterior

O backend anterior oferecia somente quote, checkout com redirecionamento e webhook. Não havia login real, admin, expiração, cupons ou idempotência de criação do pedido. Ele verificava `meta.changes` depois de um batch já confirmado: uma atualização que afetasse zero linhas não causava rollback. Além disso, webhooks concorrentes podiam alterar estoque antes de reconhecer que o pedido já fora pago. A nova versão faz a reserva por trigger que lança erro SQL e a baixa depende da transição efetiva do pedido.

## 1. Cloudflare: banco, Worker e imagens

No painel Cloudflare:
1. **Storage & databases → D1 → Create database**. Nome: `gelz-store-staging`. Anote somente o ID público do banco.
2. Faça uma cópia de segurança se já houver banco existente. Não execute seed novamente como substituição de dados. O seed usa `INSERT OR IGNORE`, mas deve ser reservado à instalação inicial.
3. Em ambiente local autorizado com Node e Wrangler, autentique com `npx wrangler@4 login`. O login ocorre no navegador, nunca cole token no chat.
4. No `store/api/wrangler.toml`, acrescente o vínculo real:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gelz-store-staging"
database_id = "ID_PUBLICO_DO_BANCO"
migrations_dir = "migrations"
```

Para **banco novo**, na pasta `store/api`:

```bash
npx wrangler@4 d1 execute gelz-store-staging --remote --file schema.sql
npx wrangler@4 d1 execute gelz-store-staging --remote --file seed.sql
npx wrangler@4 d1 migrations apply gelz-store-staging --remote
npx wrangler@4 deploy
```

Para banco existente com schema anterior: exporte, confirme a estrutura e aplique apenas as migrações. Não repita `0001` manualmente: `wrangler d1 migrations apply` mantém o histórico. Pedidos antigos são preservados, mas não ganham automaticamente ownership, linhas de itens ou prazos; reconcilie-os antes de liberar a loja.

5. **Workers & Pages → gelz-store-api → Settings → Variables and Secrets**: configure as variáveis e secrets abaixo. Secrets são campos do tipo **Secret**.
6. **Settings → Triggers → Cron Triggers**: confira `*/5 * * * *` para reservas, reconciliação e outbox. Confira logs em **Observability**.
7. Para upload: **R2 → Create bucket**, crie `gelz-store-images`. Adicione um vínculo `IMAGES` em Settings → Bindings e também em `wrangler.toml` antes de futuras publicações:

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "gelz-store-images"
```

R2 é opcional; sem ele ainda é possível cadastrar URLs HTTPS pelo admin. Não torne o bucket inteiro público: a API serve apenas os objetos por identificador.

### Variáveis públicas do Worker

| Nome | Valor/uso |
|---|---|
| STORE_ORIGIN | `https://gelz.tech` |
| API_ORIGIN | URL HTTPS real do Worker publicado, sem barra final |
| SUPABASE_URL | URL do projeto Supabase |
| SUPABASE_ANON_KEY | Chave pública anon do projeto; **não** service_role |
| MP_PUBLIC_KEY | Public Key de **teste**, começando em `TEST-` |
| ORIGIN_CEP | CEP real de postagem, 8 dígitos |
| PAYMENTS_ENABLED | `false` inicialmente |
| MP_SANDBOX | `true` |
| ME_SANDBOX | `true` |
| NOTIFICATIONS_ENABLED | `false` até validar remetente e destinatários de teste |
| EMAIL_FROM | Remetente verificado no Resend |

### Secrets do Worker

`MP_ACCESS_TOKEN` (somente teste), `MP_WEBHOOK_SECRET`, `MELHOR_ENVIO_TOKEN` (sandbox), `RESEND_API_KEY` (opcional).

Use Settings → Variables and Secrets → Add → Secret; ou `npx wrangler@4 secret put NOME`, que solicita o valor de forma interativa. Não colocar em arquivo versionado, workflow, HTML ou conversa.

## 2. Supabase: autenticação e administrador

1. Crie ou selecione o projeto no Supabase. **Authentication → Providers → Email**: habilite e-mail/senha e confirmação de e-mail.
2. **Authentication → URL Configuration**: Site URL `https://gelz.tech/store/account/`; autorize `https://gelz.tech/store/account/` e o retorno de recuperação `https://gelz.tech/store/account/?recovery=1`.
3. **Project Settings → API**: configure URL e chave pública anon no Worker. Não é necessário usar o Postgres do Supabase para produtos/pedidos.
4. **Authentication → Email/SMTP settings**: configure provedor SMTP e domínio de remetente. Confira confirmação e recuperação com caixas de teste antes de abrir cadastro público.
5. Depois de conectar a API, crie sua conta pela loja e confirme o e-mail. Em **Authentication → Users**, localize seu e-mail e copie seu User UID (não é senha).
6. No D1 → banco → Console, autorize somente esse UID:

```sql
INSERT INTO administrators(user_id) VALUES ('SEU_UID_CONFIRMADO');
```

O UID deve ser o da sua própria conta verificada. Não existe botão público de promoção a administrador. Para revogar, remova esse UID da tabela. O frontend guarda a sessão Supabase no `sessionStorage`; ela é validada no servidor e não é um login fictício. Use MFA no acesso aos painéis dos provedores; MFA obrigatório dentro do admin da loja ainda não foi implementado.

## 3. Mercado Pago e Melhor Envio: somente testes

1. Em Mercado Pago Developers → Suas integrações → aplicação → Credenciais de teste, copie as credenciais diretamente para os campos seguros do Cloudflare.
2. Na aplicação → Webhooks, configure ambiente de teste com `<API_ORIGIN>/api/mp-webhook`, evento de pagamentos e segredo de assinatura. A URL de notificação recebe `data.id`; o corpo precisa coincidir.
3. Configure o sandbox Melhor Envio e seu token no Worker. Preencha medidas, peso e estoque conferidos pelo admin. Produtos importados continuam inativos e com estoque zero até sua revisão.
4. `PAYMENTS_ENABLED=true` libera **apenas testes** e somente se as duas chaves Mercado Pago começarem com `TEST-`, `MP_SANDBOX=true` e os vínculos básicos existirem. Produção é recusada pelo código, mesmo alterando apenas flags.
5. Use compradores e cartões oficiais de teste; valide o suporte Pix e débito na conta de teste. Não use dados de cartão real. Não afirmar que todos os meios estarão disponíveis antes da homologação da conta.
6. Para etiquetas: prepare o envio no pedido pago de teste, crie/contrate a etiqueta no painel sandbox Melhor Envio e vincule o ID no admin; use Gerar/Imprimir/Consultar rastreio. A impressão usa link privado. Não gera compra de etiqueta real.

## 4. Conectar o frontend

Somente depois de a API estar publicada e responder corretamente a `/api/health` e `/api/config`, configure a URL pública em `store/commerce-config.js`:

```js
window.GELZ_API_BASE = 'https://URL-REAL-DO-WORKER';
```

Essa URL não é segredo. Faça commit e publique pelo GitHub Pages existente. Não mude DNS do domínio principal nem hospede as outras páginas novamente. O catálogo remoto só substitui a coleção de referência quando há API configurada e resposta válida. Confira categorias/fotos/estoque antes dessa troca: o seed começa inativo.

## 5. Testes e limites da entrega

```bash
node --test store/tests/*.test.mjs
```

Node 24, SQLite real em memória com adaptador D1; HTTP dos provedores simulado. A CI repete esses testes e valida sintaxe. A simulação não substitui testes reais de Cloudflare D1, Supabase, Mercado Pago, Melhor Envio ou e-mail.

Verificações locais: adulteração de preço, cupons, duplicidade de SKU, idempotência de checkout/pagamento, timeout, rollback de estoque, expiração, webhook assinado, moeda/valor/modo, repetição, cancelamento, reembolso sem reposição automática, isolamento de clientes, admin, origem, limites de requisições e migração do catálogo.

Verificação no navegador: coleção com 24 produtos, cor/tamanho, adicionar à sacola, continuidade no checkout e pagamento bloqueado sem API, Minha conta com aviso de configuração. Layout mobile recebeu CSS responsivo, mas a navegação em dispositivo móvel real ainda precisa de validação. Dashboard autenticado, SMTP, recuperação por e-mail, Bricks, frete e etiquetas precisam de ensaios externos após configuração.

## 6. Backup, recuperação e operação

- Antes de migrações, exporte D1 com `wrangler d1 export` para armazenamento privado criptografado fora do repositório. Confira a sintaxe com `npx wrangler@4 d1 export --help` na versão instalada. Nunca publique dumps ou dados de clientes.
- Use D1 Time Travel quando disponível no plano. Defina retenção e acesso de backups; faça restauração em banco separado e verifique contagens, pedidos e estoque antes de trocar o vínculo.
- Restore de banco pode recuperar pedidos antigos já pagos: reconcilie pagamentos com Mercado Pago **antes** de reabrir vendas, evitando cobranças/baixas duplicadas.
- Não libere reserva de `paying` manualmente por atraso: confirme cancelamento/falha no provedor. Um timeout pode ter cobrado. Tentativas sem resultado visível ficam retidas para investigação; nenhum novo método é aceito no mesmo pedido.
- Logs internos usam identificador de correlação, rota e tipo de erro; não registram corpos, tokens ou dados de cartão. A auditoria D1 mantém alterações de pedidos/produtos.
- A outbox reenvia com idempotência do provedor. Retenção de eventos, reconciliação de envios de e-mail fora da janela de idempotência e alertas automáticos ainda precisam endurecimento antes da produção.

## Pendências para considerar a operação pronta

- Contas, bindings, secrets, deploy do Worker e conexão frontend.
- Aceite ponta a ponta em ambiente de teste, incluindo duas sessões concorrentes, falhas de rede, recuperação de senha, telefone e desktop/mobile.
- Razão social, endereço comercial/devolução, CEP do remetente, inventário físico, peso/dimensões e imagens corretas por variante.
- Fluxo fiscal validado (documentos do comprador quando necessários, NCM/GTIN, tributação, NF-e autorizada). Nenhuma NF-e é emitida por esta entrega.
- Compra automática de etiquetas, volumes efetivos da embalagem e sincronização automática de entrega, após configuração fiscal/remetente. Nesta entrega o status de entrega é atualizado pelo admin; consulta da etiqueta não marca automaticamente entrega.
- MFA administrativo obrigatório, política final de retenção, testes de restauração, monitoramento/alertas e revisão de segurança antes de produção.
- Sem integração ativa com TikTok Shop, Mercado Livre ou WhatsApp; os módulos de pedidos/envios podem ser reutilizados quando essas integrações forem autorizadas.
- Pagamentos reais só após aprovação explícita, alteração controlada da trava em código e nova validação. Não há promessa de prontidão de produção neste commit.

## Referências oficiais consultadas

- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://supabase.com/docs/guides/auth/passwords
- https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/default-rendering
- https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/payment-submission/other-payment-methods
- https://docs.melhorenvio.com.br/reference/inserir-fretes-no-carrinho
- https://docs.melhorenvio.com.br/reference/geracao-de-etiquetas
- https://docs.melhorenvio.com.br/reference/impressao-de-etiquetas
- https://docs.melhorenvio.com.br/reference/rastreio-de-envios
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
