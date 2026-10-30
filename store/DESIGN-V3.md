# GELZ Store — Visual v3

Atualização de design publicada no diretório `/store/` com identidade escura, moderna e responsiva.

## O que mudou
- Navegação inferior flutuante em efeito glass com backdrop blur, saturação, cantos arredondados e redução automática ao rolar para baixo. Ao subir, os rótulos reaparecem.
- Fonte Inter, cartões arredondados, cores escuras, microinterações, revelação de conteúdo e feedback ao segurar cartões.
- Home com destaque rotativo, transições e agrupamento da vitrine por **Feminino → Masculino → Infantil**.
- Clique nos produtos abre **`/store/product.html?id=...`** com galeria, gesto de swipe, zoom ao segurar, seletor de tamanho, bolinhas de cor, detalhes/descrições por item e relacionados.
- Galerias expandidas para todas as imagens distintas constantes nos quatro arquivos enviados pelo titular: **141 imagens distintas**.
- Descrições editoriais individuais baseadas nos textos fornecidos do TikTok Shop.
- Carrinho em armazenamento local mantido; não se aceita pagamento real na prévia.

## Associação de cores e fotos

Os quatro arquivos TikTok Shop repetem as mesmas fotos em cada SKU da mesma peça. Eles **não** incluem uma relação confiável `cor → imagem`. Portanto o sistema somente fixa uma foto específica à cor quando há um arquivo correspondente nomeado e já disponível no acervo do site (13 combinações confirmadas). Nas demais variantes, a cor selecionada é refletida na interface e na sacola, mas a galeria continua sendo a original do modelo. Não se deve usar fotos arbitrárias como se retratassem a variante.

Para concluir correspondência das demais cores, é necessário importar fotos individuais com metadados de cor ou aprovar manualmente um mapeamento de cada imagem.

## Pagamentos
Checkout real permanece bloqueado. Esta alteração prioriza **design** antes de loja operacional; o backend anterior continua sem credenciais e com estoque não validado.

## Principais arquivos
- `store/design-v3.css`
- `store/motion-v3.js`
- `store/product.html`
- `store/product-v3.css`
- `store/product-v3.js`
- `store/description-v3.js`
- `store/catalog-v2.js` (galerias expandidas)
