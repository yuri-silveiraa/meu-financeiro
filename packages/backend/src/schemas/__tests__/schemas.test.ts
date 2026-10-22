import { describe, it, expect } from 'vitest';
import {
  transacaoQuerySchema,
  createTransacaoSchema,
  updateManyPagoSchema,
} from '../transacao.schema.js';
import { createGastoFixoSchema } from '../gastoFixo.schema.js';
import { createCartaoSchema } from '../cartao.schema.js';

describe('Zod Schemas Resilience', () => {
  describe('transacaoQuerySchema', () => {
    it('converte strings vazias em query params para undefined com sucesso', () => {
      const query = {
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: '',
        pago: '',
        categoriaId: '',
        contaId: '',
        cartaoId: '',
      };

      const result = transacaoQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dataInicio).toBe('2026-10-01');
        expect(result.data.dataFim).toBe('2026-10-31');
        expect(result.data.tipo).toBeUndefined();
        expect(result.data.pago).toBeUndefined();
        expect(result.data.categoriaId).toBeUndefined();
        expect(result.data.contaId).toBeUndefined();
        expect(result.data.cartaoId).toBeUndefined();
      }
    });

    it('faz parse correto quando query params possuem valores válidos', () => {
      const query = {
        tipo: 'receita',
        pago: 'true',
        categoriaId: '5',
      };

      const result = transacaoQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipo).toBe('receita');
        expect(result.data.pago).toBe(true);
        expect(result.data.categoriaId).toBe(5);
      }
    });

    it('rejeita valores inválidos quando informados', () => {
      const query = {
        tipo: 'invalido',
      };

      const result = transacaoQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe('createTransacaoSchema', () => {
    it('converte chaves estrangeiras vazias em null e tipo_pagamento vazio em undefined', () => {
      const body = {
        data: '2026-10-15',
        descricao: 'Salário',
        valor: '5000',
        tipo: 'receita',
        tipo_pagamento: '',
        categoria_id: '',
        conta_id: '',
        cartao_id: '',
      };

      const result = createTransacaoSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoria_id).toBeNull();
        expect(result.data.conta_id).toBeNull();
        expect(result.data.cartao_id).toBeNull();
        expect(result.data.tipo_pagamento).toBeUndefined();
        expect(result.data.valor).toBe(5000);
      }
    });
  });

  describe('createGastoFixoSchema', () => {
    it('converte FKs e campos vazios corretamente', () => {
      const body = {
        nome: 'Internet',
        valor: '120.00',
        dia_vencimento: '10',
        tipo_pagamento: '',
        categoria_id: '',
        conta_id: '',
        cartao_id: '',
      };

      const result = createGastoFixoSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoria_id).toBeNull();
        expect(result.data.dia_vencimento).toBe(10);
      }
    });
  });

  describe('createCartaoSchema', () => {
    it('converte conta_padrao_id vazio para null', () => {
      const body = {
        nome: 'Nubank',
        limite: '2000',
        dia_fechamento: '5',
        dia_vencimento: '12',
        conta_padrao_id: '',
      };

      const result = createCartaoSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conta_padrao_id).toBeNull();
      }
    });
  });

  describe('updateManyPagoSchema', () => {
    it('valida array de ids e booleano pago com sucesso', () => {
      const body = {
        ids: [1, 2, 3],
        pago: true,
      };

      const result = updateManyPagoSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1, 2, 3]);
        expect(result.data.pago).toBe(true);
      }
    });

    it('rejeita payload sem ids ou com array vazio', () => {
      const result = updateManyPagoSchema.safeParse({ ids: [], pago: true });
      expect(result.success).toBe(false);
    });
  });
});
