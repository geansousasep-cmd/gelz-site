# GELZ STORE — Nova loja mobile-first (fase 1)

Este projeto fica **isolado** em `store/`, na branch `feature/gelz-store-mobile`.
Não modifica `index.html` nem o domínio atual `gelz.tech`.

## Estado verificável

- [x] UI mobile-first: home editorial, catálogo, detalhes, busca, categorias, favoritos, navegação inferior, drawer da sacola.
- [x] Reutilização das **fotos já versionadas** no repositório.
- [x] Produtos de exemplo extraídos do conteúdo do site atual, mas todos com `status: "draft"`, sem inventar preço ou estoque.
- [x] Sem botão que aceite um pedido real: não existe checkout ativo, cadastro real, frete, nota fiscal ou impressão de etiqueta nesta fase.
- [ ] Importar XLSX de produtos TikTok Shop atualizado + fotos com permissão de uso, preços e estoque validados.
- [ ] Criar backend privado e banco de dados persistente (produtos/SKUs/pedidos/clientes).
- [ ] Login seguro dos clientes e do administrador.
- [ ] Integrar Mercado Pago no ambiente de teste; validar Webhooks assinados; impedir duplicidade de pedidos.
- [ ] Integrar Melhor Envio para cotação, compra autenticada de etiquetas, PDF/ZPL e rastreamento.
- [ ] Informações fiscais, termos, política de privacidade, trocas e devoluções.
- [ ] Testes automatizados, segurança, observabilidade e publicação de produção.
- [ ] Separar a loja em repositório privado para deployment, com infraestrutura Cloudflare, sem afetar projetos existentes.

## Visualização local

1. Faça checkout desta branch.
2. Na raiz de `gelz-site`, inicie um servidor estático, por exemplo:
   `python3 -m http.server 8080`
3. Abra `http://localhost:8080/store/`.

Os caminhos de imagem `../*.webp` apontam para imagens já existentes na **raiz** de `gelz-site`. Para deploy em `store.gelz.tech` como projeto isolado, copie/migre esses ativos para um armazenamento próprio e atualize os caminhos.

## Regras antes de habilitar vendas

1. Produto só vai ao ar se SKU/variante, estoque real, peso, medidas, preço e procedência estiverem confirmados.
2. Trate pagamentos por API no servidor, nunca use preços enviados pelo navegador como fonte da verdade.
3. O servidor deve verificar assinatura de notificações e consultar o pagamento no provedor antes de atualizar o pedido.
4. Só compre etiquetas após pagamento confirmado, com idempotência e registro da cotação escolhida.
5. Preserve segredos em variáveis do ambiente de execução, **nunca** em repositório ou código client-side.
6. Toda publicação em produção requer testes e autorização explícita.

## Integração TikTok Shop

Este chat não compartilha a sessão autenticada do Seller Center aberta no ChatGPT Work. Para migrar todos os produtos, exporte o modelo de **todas as informações** no Seller Center e envie o XLSX; imagens poderão precisar ser baixadas em separado, conforme o tipo de link exportado. Valide o inventário antes da publicação.

## Titularidade e marcas

Arquivos de foto já existentes no GitHub foram usados apenas como material visual de prévia.
Verifique autenticidade, autorização de uso das fotos, marca e origem dos produtos antes da venda ou anúncio.

## Próximos passos técnicos

Recomendação para fase 2: Cloudflare Pages/Workers + D1/R2, Mercado Pago e Melhor Envio, sempre com configuração e testes reais. A conta Mercado Pago pode ser CPF dependendo de elegibilidade, mas o recebimento e a emissão fiscal precisam refletir a operação e o CNPJ do vendedor quando houver.
