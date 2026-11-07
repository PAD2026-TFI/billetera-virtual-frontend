import { describe, expect, it } from 'vitest';
import { detectCardBrand, formatCardNumber, formatExpiry, isExpired, isValidLuhn, simulatedRejection } from './cards';

describe('tarjetas', () => {
  it('detecta la marca como el simulador del backend', () => {
    expect(detectCardBrand('4509 9535')).toBe('Visa');
    expect(detectCardBrand('5256')).toBe('Mastercard');
    expect(detectCardBrand('3700')).toBe('American Express');
    expect(detectCardBrand('5896 57')).toBe('Cabal');
    expect(detectCardBrand('9')).toBeNull();
  });

  it('formatea número y vencimiento mientras se escribe', () => {
    expect(formatCardNumber('4509953566233704999')).toBe('4509 9535 6623 3704');
    expect(formatCardNumber('370000000001111')).toBe('3700 0000 0001 111');
    expect(formatExpiry('1230')).toBe('12/30');
    expect(formatExpiry('1')).toBe('1');
  });

  it('valida con el algoritmo de Luhn y el vencimiento', () => {
    expect(isValidLuhn('4509 9535 6623 3704')).toBe(true);
    expect(isValidLuhn('4509 9535 6623 3705')).toBe(false);
    expect(isExpired('10/26', new Date(2026, 10, 6))).toBe(true);
    expect(isExpired('11/26', new Date(2026, 10, 6))).toBe(false);
  });

  it('aplica las reglas de rechazo del sandbox', () => {
    expect(simulatedRejection({ number: '4509953500030000', cvv: '123' }).code).toBe('INSUFFICIENT_FUNDS');
    expect(simulatedRejection({ number: '4509953566233704', cvv: '999' }).code).toBe('INSUFFICIENT_FUNDS');
    expect(simulatedRejection({ number: '5256341200009999', cvv: '123' }).code).toBe('CARD_BLOCKED');
    expect(simulatedRejection({ number: '4509953566233704', cvv: '123' })).toBeNull();
  });
});
