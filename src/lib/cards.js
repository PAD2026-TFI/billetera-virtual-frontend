export const onlyDigits = value => String(value ?? '').replace(/\D/g, '');

export function detectCardBrand(number) {
  const digits = onlyDigits(number);
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(5896|6042)/.test(digits)) return 'Cabal';
  return null;
}

export const cardNumberLength = number => (detectCardBrand(number) === 'American Express' ? 15 : 16);

export const cvvLength = number => (detectCardBrand(number) === 'American Express' ? 4 : 3);

export function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, cardNumberLength(value));
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function isValidLuhn(number) {
  const digits = onlyDigits(number);
  if (!digits) return false;
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function isExpired(expiry, now = new Date()) {
  const [month, year] = expiry.split('/').map(Number);
  const fullYear = 2000 + year;
  return fullYear < now.getFullYear() || (fullYear === now.getFullYear() && month < now.getMonth() + 1);
}

export function simulatedRejection({ number, cvv }) {
  const digits = onlyDigits(number);
  if (digits.endsWith('0000') || cvv === '999') return { code: 'INSUFFICIENT_FUNDS', message: 'La tarjeta no tiene fondos suficientes.' };
  if (digits.endsWith('9999')) return { code: 'CARD_BLOCKED', message: 'La entidad emisora bloqueó la tarjeta.' };
  if (digits.endsWith('1111')) return { code: 'SUSPECTED_FRAUD', message: 'El pago se rechazó por sospecha de fraude.' };
  return null;
}
