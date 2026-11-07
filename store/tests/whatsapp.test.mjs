import test from 'node:test';
import assert from 'node:assert/strict';
import {orderWhatsAppUrl} from '../whatsapp.js';

const catalog=[
 {id:'1',name:'Conjunto com capuz',price:89.99,colors:[{name:'Preto',sizes:['M','G']}]},
 {id:'2',name:'Blusa feminina',price:49.99,colors:[{name:'Azul',sizes:['P']}]}
];
test('Pedido WhatsApp respeita cor, tamanho, quantidade e produtos diferentes',()=>{
 const url=orderWhatsAppUrl([
  {id:'1',color:'Preto',size:'G',qty:2},
  {id:'2',color:'Azul',size:'P',qty:1}
 ],catalog);
 const link=new URL(url);
 assert.equal(link.hostname,'wa.me');
 assert.equal(link.pathname,'/5511971443233');
 const msg=link.searchParams.get('text');
 for(const value of ['Conjunto com capuz','Blusa feminina','Cor: Preto','Cor: Azul','Tamanho: G','Tamanho: P','Quantidade: 2','Quantidade: 1','Subtotal de referência: R$ 229,97','product.html?id=1'])assert.ok(msg.includes(value),value);
});
test('Sacola vazia ou só itens indisponíveis não gera mensagem',()=>{
 assert.throws(()=>orderWhatsAppUrl([],catalog));
 assert.throws(()=>orderWhatsAppUrl([{id:'nao-existe',qty:1}],catalog));
});
