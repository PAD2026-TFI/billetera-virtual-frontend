export function parseMoney(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replace(',', '.'));
  return amount > 0 ? Math.round(amount * 100) / 100 : null;
}
