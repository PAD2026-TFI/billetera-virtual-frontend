import { describe, expect, it } from 'vitest';
import { parseQrPaymentCode } from './qr';

describe('parseQrPaymentCode', () => {
  it('extracts token from checkout index url', () => {
    expect(parseQrPaymentCode('http://localhost:5000/checkout/index.html?token=mch-9d2a1b3c')).toBe('mch-9d2a1b3c');
  });

  it('extracts token from relative checkout index path', () => {
    expect(parseQrPaymentCode('checkout/index.html?token=mch-9d2a1b3c')).toBe('mch-9d2a1b3c');
  });

  it('extracts token from standard checkout query', () => {
    expect(parseQrPaymentCode('http://localhost:5173/checkout?token=mch-456')).toBe('mch-456');
    expect(parseQrPaymentCode('/checkout?token=mch-456')).toBe('mch-456');
    expect(parseQrPaymentCode('?token=mch-456')).toBe('mch-456');
    expect(parseQrPaymentCode('token=mch-456')).toBe('mch-456');
  });

  it('decodes encoded characters in token parameter', () => {
    expect(parseQrPaymentCode('checkout/index.html?token=mch%2Dxyz%2D789')).toBe('mch-xyz-789');
  });

  it('preserves plain codes and mock identifiers', () => {
    expect(parseQrPaymentCode('QR-CAFE-001')).toBe('QR-CAFE-001');
    expect(parseQrPaymentCode('mch-direct-token')).toBe('mch-direct-token');
    expect(parseQrPaymentCode('techstore-auriculares')).toBe('techstore-auriculares');
  });

  it('handles spaces and empty input gracefully', () => {
    expect(parseQrPaymentCode('  checkout/index.html?token=test-token   ')).toBe('test-token');
    expect(parseQrPaymentCode('')).toBe('');
    expect(parseQrPaymentCode(null)).toBe('');
    expect(parseQrPaymentCode(undefined)).toBe('');
  });
});
