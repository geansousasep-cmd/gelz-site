# GELZ STORE — E-commerce v2 (código executado neste repositório)

## O que está implementado na branch
- Home editorial mobile-first e navegação inferior no celular.
- **24 produtos reais** e **280 combinações exatas de cor/tamanho**, extraídos dos 4 Excel TikTok Shop.
- Preços reais da exportação; nomes comerciais encurtados sem inventar atributos.
- Seleção de **bolinhas de cor**. Quando há imagem com cor identificada nos arquivos locais, a foto muda. Para a maioria dos produtos, a planilha repete a mesma galeria em todas as cores; portanto não associamos imagens erradas a variantes.
- Detalhes com galeria e seleção de tamanho, favoritos locais, carrinho persistente com quantidades e subtotal.
- Formulário de checkout com dados, endereço, consulta de frete, resumo e redirecionamento **Mercado Pago Checkout Pro** quando configurado.
- Código de backend Cloudflare Worker: preços conferidos no banco D1, estoque por variante, Melhor Envio, Mercado Pago e validação de assinatura do webhook.

## O que está deliberadamente bloqueado
**Nenhuma cobrança real está habilitada.** `window.GELZ_API_BASE` não foi configurada e `PAYMENTS_ENABLED` deve permanecer `false` até concluir:
1. Criar Cloudflare Worker e banco D1.
2. Aplicar `schema.sql` e `seed.sql`.
3. Adicionar peso/dimensões e estoque real por SKU; produtos e variantes vêm INATIVOS e com estoque ZERO por padrão.
4. Conectar a conta Mercado Pago via segredo `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`.
5. Conectar Melhor Envio: `MELHOR_ENVIO_TOKEN`, `ORIGIN_CEP`.
6. Definir `STORE_ORIGIN`, `API_ORIGIN`, URLs oficiais de retorno e DNS do backend.
7. Fazer testes reais de estoque, frete, recebimento, cancelamento e idempotência.
8. Definir fiscal, política de privacidade e dados da empresa.

## Publicação
A prévia visual está em `https://gelz.tech/store/` após merge no branch principal.
A integração do Worker não roda no GitHub Pages. Use Cloudflare Worker/Pages Functions para a API. Não publique credenciais no repositório.
Adicione o frontend (somente após configurar e verificar backend) `window.GELZ_API_BASE='https://api.store.gelz.tech'` antes de carregar `store-v2.js`.
No Worker, `PAYMENTS_ENABLED` deve ficar `false` enquanto não forem completados os testes e os controles de expiração de reservas de estoque.
Não confunda **checkout implementado em código** com **checkout conectado para pagamentos reais**.

## Imagens por cor
Os quatro Excel contêm a mesma lista de fotos para todas as variantes do mesmo produto.
Imagens identificadas no acervo original GELZ foram vinculadas por cor apenas nos produtos correspondentes.
Para obter troca de foto fiel nas demais peças, são necessárias fotos nomeadas por cor no upload ou uma biblioteca do Seller Center que forneça a ligação SKU → foto.

## Referências para a integração
- Mercado Pago: https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/create-preference/post
- Webhooks: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
- Melhor Envio: https://docs.melhorenvio.com.br/docs/cotacao-de-fretes

## Segurança
Os dados de compradores só devem ser processados em ambiente configurado, com restrições adequadas de acesso e uma política de privacidade. Não configure credenciais no HTML, em arquivos públicos do GitHub nem em mensagens de chat.

## Atualização — 31/10/2026 (vitrine e checkout)

- O seletor de cores compartilha a mesma rotina entre home e página de produto, priorizando arquivos por cor e exibindo aviso quando a foto não corresponde comprovadamente à variante.
- A galeria tenta identificar a cor da roupa nas fotos remotas apenas quando o servidor permite leitura e a confiança é alta; fotos sem confirmação não são atribuídas a um SKU.
- Hero e campanha exibem imagens masculinas com `object-fit: contain` para evitar recortes da peça/modelo.
- Checkout: etapas visíveis, foto das variantes, resumo de preços, CEP com busca opcional por ViaCEP, escolha de frete e total atualizado.
- O botão de pagamento exige retorno `paymentsEnabled: true` da API `GET /api/health`. Sem backend conectado, fica bloqueado.
- A página de detalhes encaminha a sacola ao checkout da home.

### Para conectar Mercado Pago sem expor suas credenciais

1. Criar uma aplicação em Mercado Pago Developers no modo **Teste** e habilitar Checkout Pro, sem inserir dados secretos no código público nem no chat.
2. Implantar `store/api/worker.js` no Cloudflare Workers, configurar vínculo D1 e executar `schema.sql` e `seed.sql`.
3. Completar e validar inventário por SKU, peso, dimensões e preços; os 280 SKUs começam com estoque **0** e inativos, por segurança.
4. Configurar os **secrets** `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MELHOR_ENVIO_TOKEN`, e as variáveis `ORIGIN_CEP`, `STORE_ORIGIN`, `API_ORIGIN`, `MP_SANDBOX=true`, `ME_SANDBOX=true`.
5. Configurar `window.GELZ_API_BASE` no HTML **antes** de carregar a aplicação JavaScript (apontar ao Worker publicado); registrar a URL HTTPS do webhook no Mercado Pago.
6. Testar compra por conta comprador de teste e conferir estoque, frete, falhas, reenvio de webhook, reembolso e liberação de reservas de estoque. O backend atual requer implementação e validação da expiração das reservas antes de pagamentos de produção.
7. Somente após a validação, ativar credenciais de **produção** e `PAYMENTS_ENABLED=true`, com implantação segura e política de trocas, privacidade e informações fiscais.

**Importante:** esta atualização não conecta conta Mercado Pago, não fornece secrets, não publica o Worker e não autoriza cobranças reais. Ela prepara o frontend e preserva o checkout desabilitado por padrão.
