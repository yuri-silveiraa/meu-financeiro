import { parseTransacao } from '../nlpParser.js';

describe('nlpParser - Compras no Cartão e Parcelas', () => {
  const categorias = [
    { id: 1, nome: 'Alimentação' },
    { id: 2, nome: 'Vestuário' },
    { id: 3, nome: 'Transporte' },
  ];

  const cartoes = [
    { id: 10, nome: 'Nubank', bandeira: 'mastercard' },
    { id: 20, nome: 'Itaú Black', bandeira: 'visa' },
  ];

  it('detects installments and credit card in natural text', () => {
    const res = parseTransacao('Comprei tênis de 300 em 3x no nubank', categorias, cartoes);

    expect(res.valor).toBe(300);
    expect(res.total_parcelas).toBe(3);
    expect(res.cartao_id).toBe(10);
    expect(res.cartao_nome).toBe('Nubank');
    expect(res.tipo_pagamento).toBe('credito');
    expect(res.tipo).toBe('despesa');
  });

  it('detects credit card purchase in 1x', () => {
    const res = parseTransacao('Jantar 120 no crédito itaú', categorias, cartoes);

    expect(res.valor).toBe(120);
    expect(res.total_parcelas).toBe(1);
    expect(res.cartao_id).toBe(20);
    expect(res.tipo_pagamento).toBe('credito');
  });

  it('preserves non-card transactions as pix or debito', () => {
    const res = parseTransacao('Gastei 50 no mercado no pix', categorias, cartoes);

    expect(res.valor).toBe(50);
    expect(res.total_parcelas).toBe(1);
    expect(res.cartao_id).toBeNull();
    expect(res.tipo_pagamento).toBe('pix');
  });
});
