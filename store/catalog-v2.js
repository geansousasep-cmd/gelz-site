// Dados transcritos dos quatro modelos "All Information" exportados pelo próprio lojista.
// Não há estoque disponível nos modelos: nenhuma variante está liberada para pagamento.
// Imagens de variação: TikTok repetiu as mesmas URLs em todos os SKUs. Fotos por cor só
// são vinculadas quando a própria vitrine Gelz já apresenta arquivo separado daquela cor.
const ROOT = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/';
const P = '?dr=15568&from=520841845&height=1254&idc=my2&ps=933b5bde&shcp=2c1af732&shp=1f0b6a75&t=555f072d&width=1254';
const remote = h => ROOT+h+'~tplv-aphluv4xwc-origin-jpeg.jpeg'+P;
const swatchColors = {
 'preto':'#161616','preta':'#161616','branco':'#f6f5ef','branca':'#f6f5ef',
 'vermelho':'#b72c32','vermelha':'#b72c32','vinho':'#67243a','marrom':'#805239',
 'bege':'#d1bb9d','rosa':'#eaa5b4','rosa claro':'#ecbac7','rosa-claro':'#ecbac7',
 'rosa bebê':'#efbecf','rosa estampado':'#e7a6bb','azul':'#3277ba',
 'azul claro':'#acd4ea','azul bebê':'#a4c5ea','azul-bebê':'#a4c5ea',
 'azul marinho':'#1d3861','azul-marinho':'#1d3861','azul royal':'#1a5abd',
 'azul estampado':'#76a2c8','verde':'#467e5f','verde menta':'#9fc9ac',
 'verde oliva':'#667251','amarelo':'#efd079','amarela':'#efd079',
 'lilás':'#baa0d3','cinza':'#888b90','laranja / creme':'#d9b086',
 'conjunto | blusa + calça':'#acc2d8'
};
const resolveSwatch = (label) => {
 const n=label.toLowerCase();
 if (swatchColors[n]) return swatchColors[n];
 if (n.includes('marrom')) return swatchColors.marrom;
 if (n.includes('preta')||n.includes('preto')) return swatchColors.preto;
 if (n.includes('branco')) return swatchColors.branco;
 if (n.includes('azul')) return swatchColors.azul;
 return '#b5b9c1';
};
const rows = [
 ['1738128185415403253','Feminino','Blusa um ombro só com babados',59.99,'Rosa:P,M,G;Branco:P,M,G','4ba85e0a1e754153aefb7fe53852f44b,c9e5ee18d6e043fda9103f0120ff46d3,38abb0f67b6e4d2885373a1fc7d9b33f,9b50f9fd09fa4b1abba40d3a2f1df2cc'],
 ['1738128235053680373','Feminino','Regata feminina alcinha fina evasê',59.99,'Vinho:P,M,G','b85526140c3e421497bf3f2bd33c3e5b,6bd3f148d0b44f4197cdf455c989d54d,7c8a010fa0104bfe9fcef995dbeeaecd'],
 ['1738148858442254069','Feminino','Blusa floral manga flare com amarração',59.99,'Branco:P,M,G;Azul-marinho:P,M,G;Rosa-claro:P,M,G;Amarelo:P,M,G;Azul-bebê:P,M,G','dfc679cabda94ed9baef10d5e7dd4283,17a8197cc9f94ebda6761d665b561296,126c36dd5c214b45858a385334455786,72d2e270132845929fdea126b2ed987e'],
 ['1738149265154279157','Feminino','Blusa floral estampada manga longa',59.99,'Rosa Estampado:P,M,G;Azul Estampado:P,M,G;Laranja / Creme:P,M,G','51988700b4084ce7b6a3a37e9f2a07aa,66e32715ef0f4f848cdfb49cec014fa1,cb828c5665cf4852925e1447228fe3c6,f8ded920b7154b06a7072db31ed7bcd0'],
 ['1738149616206710517','Feminino','Blusa cropped poá com babados',59.99,'Verde Menta:P,M,G;Azul Claro:P,M,G;Branco:P,M,G','570b85de00f4462781b585e15d32beb3,c33c0941e8ac413e8041e3b0d6044da7,91341bdd4d5a4b2a91133ddbcba30739,a8ac97c1e09e4c63aafd57eef1b2aec1'],
 ['1738149997272008437','Feminino','Cropped liso manga longa com babados',59.99,'Preto:P,M,G;Branco:P,M,G;Amarelo:P,M,G;Azul Bebê:P,M,G;Rosa Bebê:P,M,G;Vermelho:P,M,G;Verde Menta:P,M,G;Lilás:P,M,G','3b09b9e509b947f18e379848f46fec48,2291e37b6c264ade95e0e3ab07d19883,00664e86bdd0432ca2c0f2b79df0226e,e9029d8fdeae4dd784ab6c0810c43499'],
 ['1738150526028777205','Feminino','Saia Gisely midi evasê cintura alta',69.99,'Azul Claro:P,M,G;Preto:P,M,G;Branco:P,M,G;Lilás:P,M,G;Rosa Claro:P,M,G','a4e3892c07c2480780fb74137f005b7b,6685ee40da864cf2b7b067d29f369ee3,74228ae8f84f4533b922905d67607c46,0f26bdc248134f1ebf8495719b59bbc6'],
 ['1738238285252036341','Feminino','Saia curta em couro com renda',54.99,'Marrom:P,M,G;Preto:P,M,G','9f0796501605479285b2b3b55211a5be,86e07d72f789487eb4f0555e62a2cff2,c8524a8e7665440da89e2607d842246b'],
 ['1738238535391151861','Feminino','Conjunto blusa e saia em couro',79.99,'Blusinha Manga Longa + Saia Marrom:P,M,G;Blusinha Manga Longa + Saia Preta:P,M,G;Blusinha Manga Curta + Saia Preta:P,M,G;Blusinha Manga Curta + Saia Marrom:P,M,G','3f71beeb917242a495c888f59485b405,e0026966d1ab4c618ee9ce45ad40da29,fed040c37da9455f8d318550f744b1d1,d5f6aa1b87344a3eb85361242d9baaf6'],
 ['1738238889858860789','Feminino','Saia longa evasê em cetim',69.99,'Verde Oliva:P,M,G;Branco:P,M,G;Vermelho:P,M,G','eeaf26689af74236a4add0aa5f67a119,2c66bfca3e79480c92e655497b81eacd,ce2e4835d78f45bbbd48ae9f1ee6af3b'],
 ['1738239090734630645','Feminino','Calça pantalona risca de giz',69.99,'Branco:P,M,G;Preto:P,M,G','7ddafcc86fe94811a88ce89b478de085,6a198703c4e345efada5894af92ad958,0b46966a56324eb78f2b10c36deaca10'],
 ['1738239345335895797','Feminino','Calça pantalona cintura alta com pregas',69.99,'Azul Claro:P,M,G;Conjunto | Blusa + Calça:P,M,G','839297e842e144058c63af289d281d22,b91c07947d2a4697bdb9f9d2beea7dc8,21cf0e5700594db2a383498697e573c2'],
 ['1738239897532729077','Feminino','Blusa floral com babados manga longa',59.99,'Azul:M,G,GG;Preta:M,G,GG;Marrom:M,G,GG','dd607f6c95a54ab18033c4d0357bfd14,4b5c546ea5244ac0b2e36f513fac2ed2,a948407a259245e381286294225082df'],
 ['1738240233990162165','Feminino','Blusa lisa com babados manga longa',59.99,'Branca:P,M,G;Preta:P,M,G;Vermelha:P,M,G;Amarela:P,M,G;Azul:P,M,G','ce3b7f1a015f4f67b3c8695050f8058b,0dce289f451a436d90244dbfc63d2e6a,b3154df4c9a84f6fb053831b6a5c8489'],
 ['1738240434032314101','Feminino','Short alfaiataria botão dourado',64.99,'Verde:P,M,G;Bege:P,M,G;Branco:P,M,G','ac75ccbcbacb4b7d9ba64d5b3f3e01d9,e0ad1508470b409487240f99a6b09c11,eac49748701f4de997ffad9cb8cd530d'],
 ['1738241043796625141','Feminino','Blusa manga curta gola quadrada',49.99,'Verde:P,M,G;Vermelha:P,M,G;Azul:P,M,G;Preta:P,M,G','97ae3d3edc9648888acb27c1909fbf04,2cf0fbf3f5b54736b7e76d0a7d59fc63,1982e5701031436aab4dd9c90dd3a6a6'],
 ['1737402795005347743','Masculino','Conjunto masculino flanelado com zíper',87.99,'Azul bebê:M,G,GG;Branco:M,G,GG;Preto:M,G,GG;Vermelho:M,G,GG','ca36caa595d240d7a65419f21b52e22e,e53eba085ab946b3abe72a29178a5261,70d22fea28e84859900b2b215ab107e9'],
 ['1737492614665439135','Masculino','Conjunto jaqueta capuz + jogger',89.99,'Azul marinho:M,G,GG;Cinza:M,G,GG;Branco:M,G,GG;Preto:M,G,GG','fc32f481ed27480faf43ce42fa40ae50,4b38b3ce8b1441b8a3ce300b5eef2e85,7b851d2e9b4745dba9a0d63fae78e327'],
 ['1737559008977651615','Infantil','Conjunto infantil camiseta + shorts',47.99,'Azul Marinho:10,12,14,16;Vermelho:10,12,14,16;Cinza:10,12,14,16;Branco:10,12,14,16;Bege:10,12,14,16;Preto:10,12,14,16','b35851aec7de4427b07cbe358dc05fa8,c3f6c273abb747e9832d88de796bc0cf,959470d7f5744e6c8bd7f79af82bd2e3'],
 ['1737797898574071711','Masculino','Conjunto masculino jaqueta flanelada',95.90,'Preto:M,G,GG;Branco:M,G,GG;Bege:M,G,GG','7d5f03804c1f41059eabae21f8293af2,fb4549d194f748d9bafe2aca1816c036,303d296fdc7544078f2e468740882ad3'],
 ['1737798974318282655','Masculino','Conjunto flanelado esportivo casual',95.90,'Preto:M,G,GG;Branco:M,G,GG;Bege:M,G,GG','ff563845d6d14a5aac5784baf01a208d,1f33cf562bc64e3ab8f3f7327a147a2a, a9e529373c824885b5102e330fc7bad1'],
 ['1738047252230408095','Infantil','Conjunto infantil dry fit colmeia',47.99,'Vermelho:10,12,14,16;Preto:10,12,14,16;Cinza:10,12,14,16;Azul Marinho:10,12,14,16;Branco:10,12,14,16;Bege:10,12,14,16;Azul Royal:10,12,14,16','70dfeaac87b74284bc769e275871a844,5602879e4c00435384630b329578fbc5,66679b156ff043b0b7ff083d1a922ade'],
 ['1737402743979542431','Masculino','Conjunto masculino dry fit colmeia',65.99,'Preto:M,G,GG;Bege:M,G,GG;Marrom:M,G,GG','af839a8b95194fc3acbd659ff7610c87,ecb010cbd4d34acbae6f180eb2ccfad4,6b381595aa3144bc939cdc18ee58b0c7'],
 ['1738180533454538655','Masculino','Conjunto masculino camiseta e shorts',57.99,'Marrom:M,G,GG;Branco:M,G,GG;Preto:M,G,GG;Verde:M,G,GG','578a4f537d13408180f833deb6257daf,cc0048f9058c49e69b4a2ba493ea7422,04ec872d8f5041a4bc7b5f0ea97a9fc5']
];
const knownImages = {
 '1737402795005347743': {'Azul bebê':'../bestseller-azul.webp','Branco':'../bestseller-branco.webp','Preto':'../bestseller-preto.webp','Vermelho':'../bestseller-vermelho.webp'},
 '1737492614665439135': {'Azul marinho':'../capuz-marinho.webp','Cinza':'../capuz-cinza.webp','Branco':'../capuz-branco.webp','Preto':'../capuz-preto.webp'},
 '1737559008977651615': {'Vermelho':'../running-vermelho.webp','Cinza':'../running-cinza.webp'},
 '1737402743979542431': {'Preto':'../lv-preto.webp','Bege':'../lv-bege.webp','Marrom':'../lv-marrom.webp'}
};
const baseSizePattern = {P:0,M:1,G:2,GG:3,'10':0,'12':1,'14':2,'16':3};

const extraPhotoHashes = {
 "1738128185415403253": "d6ffa4e249a14e9fbc64a7d5de81ab19",
 "1738128235053680373": "44350b014ea9407f8d67892c0894f760",
 "1738148858442254069": "469e264bfce344bcb83068620c6e97bc,9dc61ea105ec4efabf152d2dfbfb943c,93ba7d2c429841d3b2a07a3d54e9702c",
 "1738149265154279157": "01e0a9b150e0490a98b122702847d8a1,4f1555477a87490db022c28b5f91c805",
 "1738149616206710517": "fb71160139304cfaadf0ddc40aab915b,c32476dc7eca4434acb068043191bb0d",
 "1738149997272008437": "a63b74ecaf74486693b0a22cbfdc2260,d7de803fb24f45efa3ddcf376d159a01,b55cd2452b7e4087b2cdd21581497185,ab13e09f189a4f39a984dbe08ade7989,99df99a016a34594808a8af2b60331ee",
 "1738150526028777205": "dd6cf766bce1481185f7ce26daa437fd,9acbb3bf71d34a1db68c963ea924eb69,edb99dee0a8843019350be9dbef34610,5328b02ee899459a8066a2e5a85e8a82,ed763b5006984254819d0589f9a0c3e8",
 "1738238285252036341": "5471e79d863b4c138c521bb277b3950b,466064e19715416ab7ff8deb28b9d08f",
 "1738238535391151861": "8f3b41e527be4742b1a929a70a637595,1afb2dcdc4d44e3ab0182f7e21d1ac6c",
 "1738238889858860789": "47fb4a6559c644edbaf45f9db4bdfd7f,13e5da4ea05a426fba51b2a24c62c92c",
 "1738239090734630645": "b0219abe046c4b319279d0114b5df5e2",
 "1738239345335895797": "ebf65296f6b74b2ea4b56e40618b9498,973c240c0c83436c9d3692cb7c946a87,d9998f1157254c7da3cf354cb449e8f7",
 "1738239897532729077": "6660efc201714d1ca3807e11fc92f04f,10f34f56a9184f15b88f09eeea960ac4",
 "1738240233990162165": "74a1127bacb945da9fa98cba1d8fe858,0205a8de2a544938a2e10243ab78ffa2,67fe73851c0e43aba1430de36922de8b,05ce2131528c499ba2a8b38769d32711",
 "1738240434032314101": "822fecec06af4326bd27f42f99c96e6a",
 "1738241043796625141": "922ce79b600347dca6baa963ebe93d1d,64820824f3c34b529ed6db808bb290a2,67fb46b2a36e4b70bed4d7d4365a569d",
 "1737402795005347743": "ea3b24ec133f4f5d89387d75f41bc038,916644b2ccdf40bb9e096301c5611eb4,4024f05ea3434f71a449c5bf9a00bcf6",
 "1737492614665439135": "dbbaa078fb594f97b58c877f5d7e3f19,9d8047b7b28943dabe8c620aca3d04f5,55912e9a14194302acbce4dc02b7fe65",
 "1737559008977651615": "09d04e2109054349a02bd60f7a6ea2f9,7b6ad8db7e414e32afd6d2358c5716d8,709759b2ec3d42b0a6803fd2c916a422,a79cbd7f3334405ba9d17530d6704dcc",
 "1737797898574071711": "034d26e5e3544ab2b3e69a4638f64c8a,08cf224a69c243d590a0a1c02b0b06da,30d1e18217994fda95ea731db828136f,7115b91c273e47cbb21fb1d90fcca97a,8bad49cd8edf42bc908ac0beea58910c",
 "1737798974318282655": "fb4549d194f748d9bafe2aca1816c036,303d296fdc7544078f2e468740882ad3,034d26e5e3544ab2b3e69a4638f64c8a,8bad49cd8edf42bc908ac0beea58910c",
 "1738047252230408095": "51b4553487504d91ae17d6c55ac523ab,d3da429a417f40f1b47bb0a07289d536,b8167ace99d34d84a98a980662f6fc7f,6f43fe4f31ef4b71a9f8a25989fb9308,c9bbb4ec67204157908a0a40d669c6ad",
 "1737402743979542431": "4329281934ad4b46850ff09881886aec,60423d5bf9f4415889752a96e0de2fd2",
 "1738180533454538655": "599e6ba9e2634d4fbeb332a62a0dd46f"
};
export const catalog = rows.map(([id,category,name,price,colorRules,images]) => {
  const colors = colorRules.split(';').map(rule => {
    const divider = rule.lastIndexOf(':');
    const name = rule.substring(0,divider);
    const sizes = rule.substring(divider+1).split(',');
    return {name, hex:resolveSwatch(name), sizes, image:knownImages[id]?.[name]||null};
  });
  const allImages=[...new Set([...images.split(',').map(x=>x.trim()).filter(Boolean),...(extraPhotoHashes[id]||'').split(',').filter(Boolean)])].map(remote);
  return {id, category, name, price, colors, images:allImages,
    image:colors.find(x=>x.image)?.image||allImages[0], // Foto de referência apenas
    variants:colors.flatMap(c=>c.sizes.map(size=>({color:c.name,size,price,stock:null}))),
    shippingReady:false, checkoutReady:false, status:'catalogado'
  };
});
export const catalogStats = {products:24, variants:280, colors:89, source:'TikTok Shop — exportação 28/10/2026'};
