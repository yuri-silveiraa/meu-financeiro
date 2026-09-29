import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import {
  initialForm,
  initialFilters,
  getCurrentMonthRange,
  formatInputDate,
} from '../constants';
import { useTransacoes } from '../TransacoesContext';
import { formatDataBr } from '../../../utils/date';

describe('Transacoes Constants & Helpers', () => {
  it('initialForm produces correct defaults', () => {
    const form = initialForm();
    expect(form.tipo).toBe('despesa');
    expect(form.tipo_pagamento).toBe('debito');
    expect(form.total_parcelas).toBe(1);
    expect(form.pago).toBe(false);
    expect(form.descricao).toBe('');
    expect(form.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formatInputDate formats date properly to YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 15); // May 15, 2026
    expect(formatInputDate(d)).toBe('2026-05-15');
  });

  it('getCurrentMonthRange returns valid start and end dates', () => {
    const range = getCurrentMonthRange();
    expect(range.dataInicio).toMatch(/^\d{4}-\d{2}-01$/);
    expect(range.dataFim).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(range.dataFim).getTime()).toBeGreaterThanOrEqual(
      new Date(range.dataInicio).getTime()
    );
  });

  it('initialFilters contains month range and empty filter keys', () => {
    const filters = initialFilters();
    expect(filters.dataInicio).toBeDefined();
    expect(filters.dataFim).toBeDefined();
    expect(filters.tipo).toBe('');
    expect(filters.pago).toBe('');
    expect(filters.categoriaId).toBe('');
    expect(filters.contaId).toBe('');
    expect(filters.cartaoId).toBe('');
  });

  it('useTransacoes should throw an error when used outside TransacoesProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Consumer() {
      useTransacoes();
      return null;
    }

    expect(() => {
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() => {
        root.render(<Consumer />);
      });
    }).toThrow('useTransacoes deve ser usado dentro de um TransacoesProvider');
    spy.mockRestore();
  });


  it('formatDataBr splits ISO string safely without timezone offsets', () => {
    expect(formatDataBr('2026-09-29T00:00:00.000Z')).toBe('29/09/2026');
    expect(formatDataBr('2026-12-05')).toBe('05/12/2026');
    expect(formatDataBr(null)).toBe('-');
    expect(formatDataBr('')).toBe('-');
  });
});
