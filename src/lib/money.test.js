import { describe, expect, it } from 'vitest';
import { formatMoneyInput, parseMoneyInput, toMoneyInput } from './money';

describe('formato de montos', () => {
  it('agrega puntos de miles y limita los decimales mientras se escribe', () => {
    expect(formatMoneyInput('12500')).toBe('12.500');
    expect(formatMoneyInput('12500,5')).toBe('12.500,5');
    expect(formatMoneyInput('1234567,891')).toBe('1.234.567,89');
    expect(formatMoneyInput('00a12')).toBe('12');
  });

  it('convierte entre número y texto formateado', () => {
    expect(toMoneyInput(152340.75)).toBe('152.340,75');
    expect(parseMoneyInput('152.340,75')).toBe(152340.75);
    expect(parseMoneyInput('5.000,')).toBeNull();
  });
});
