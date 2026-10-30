// Fotos e referências já presentes no repositório gelz-site.
// Dados comerciais desconhecidos ficam nulos; nenhum produto está liberado para venda.
// Depois da importação autorizada do Seller Center, este arquivo pode ser substituído
// pelo catálogo validado (ou os produtos podem vir da API do banco de dados).
export const products = [
  {
    id: "conjunto-capuz", name: "Conjunto com capuz", category: "Masculino",
    description: "Conjunto com capuz apresentado na vitrine original da Gelz Store.",
    image: "../capuz-branco.webp",
    gallery: ["../capuz-branco.webp", "../capuz-preto.webp", "../capuz-cinza.webp", "../capuz-marinho.webp"],
    colors: ["Branco", "Preto", "Cinza", "Marinho"], sizes: [],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: null
  },
  {
    id: "conjunto-running", name: "Conjunto Running", category: "Masculino",
    description: "Conjunto esportivo de camiseta e shorts exibido na seleção atual.",
    image: "../running-modelo.webp",
    gallery: ["../running-modelo.webp", "../running-bege.webp"],
    colors: ["Azul", "Bege"], sizes: [],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: "1737402662072453023"
  },
  {
    id: "conjunto-essential", name: "Conjunto Essential", category: "Masculino",
    description: "Conjunto casual da vitrine Gelz Store com versões em diferentes cores.",
    image: "../bestseller-azul.webp",
    gallery: ["../bestseller-azul.webp", "../bestseller-preto.webp", "../bestseller-branco.webp", "../bestseller-vermelho.webp"],
    colors: ["Azul", "Preto", "Branco", "Vermelho"], sizes: [],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: null
  },
  {
    id: "conjunto-urbano", name: "Conjunto Urbano", category: "Masculino",
    description: "Camiseta e shorts com faixa lateral estampada, já apresentados na vitrine da Gelz.",
    image: "../lv-bege.webp",
    gallery: ["../lv-bege.webp", "../lv-preto.webp", "../lv-marrom.webp"],
    colors: ["Bege", "Preto", "Marrom"], sizes: [],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: "1737402743979542431"
  },
  {
    id: "conjunto-esportivo", name: "Conjunto esportivo", category: "Masculino",
    description: "Camiseta e bermuda em diferentes cores disponíveis na vitrine anterior.",
    image: "../lacoste-marinho.webp",
    gallery: ["../lacoste-marinho.webp", "../lacoste-branco.webp", "../lacoste-azul.webp", "../lacoste-vermelho.webp"],
    colors: ["Marinho", "Branco", "Azul", "Vermelho"], sizes: [],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: null
  },
  {
    id: "conjunto-infantil", name: "Conjunto infantil Running", category: "Infantil",
    description: "Conjunto infantil camiseta e shorts, anunciado na vitrine existente.",
    image: "../running-azul.webp",
    gallery: ["../running-azul.webp", "../running-vermelho.webp", "../running-cinza.webp"],
    colors: ["Azul", "Vermelho", "Cinza"], sizes: ["10", "12", "14", "16"],
    price: null, compareAt: null, inventory: null, status: "draft", tiktokId: "1737559008977651615"
  }
];
