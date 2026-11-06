export function parseMoney(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replace(',', '.'));
  return amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function formatMoneyInput(value) {
  const [integerPart, ...decimalParts] = String(value).replace(/[^\d,]/g, '').split(',');
  const integer = integerPart.replace(/^0+(?=\d)/, '').slice(0, 9).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimalParts.length ? `${integer},${decimalParts.join('').slice(0, 2)}` : integer;
}

export const toMoneyInput = amount => formatMoneyInput(amount.toFixed(2).replace('.', ','));

export const parseMoneyInput = value => parseMoney(String(value).replaceAll('.', ''));
