import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency } from '../currency';

describe('formatCurrency', () => {
  it('formats positive number as BRL', () => {
    expect(formatCurrency(1234.56)).toMatch(/R\$\s1\.234,56/);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s0,00/);
  });

  it('formats negative number', () => {
    expect(formatCurrency(-50.10)).toMatch(/-R\$\s50,10/);
  });

  it('formats number without cents', () => {
    expect(formatCurrency(100)).toMatch(/R\$\s100,00/);
  });

  it('formats large number', () => {
    expect(formatCurrency(1000000.99)).toMatch(/R\$\s1\.000\.000,99/);
  });

  it('formats number with single decimal', () => {
    expect(formatCurrency(10.5)).toMatch(/R\$\s10,50/);
  });
});

describe('parseCurrency', () => {
  it('parses formatted BRL string', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
  });

  it('parses zero value', () => {
    expect(parseCurrency('R$ 0,00')).toBe(0);
  });

  it('parses simple number', () => {
    expect(parseCurrency('100')).toBe(100);
  });

  it('parses number with comma decimal', () => {
    expect(parseCurrency('10,50')).toBe(10.5);
  });

  it('parses negative formatted value', () => {
    expect(parseCurrency('-R$ 50,10')).toBe(-50.1);
  });

  it('parses empty string to NaN', () => {
    expect(parseCurrency('')).toBeNaN();
  });
});
