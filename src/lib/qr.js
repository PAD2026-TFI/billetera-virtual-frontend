export function parseQrPaymentCode(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  const tokenQueryMatch = trimmed.match(/[?&]token=([^&#\s]+)/i);
  if (tokenQueryMatch && tokenQueryMatch[1]) {
    try {
      return decodeURIComponent(tokenQueryMatch[1]).trim();
    } catch {
      return tokenQueryMatch[1].trim();
    }
  }

  const directTokenMatch = trimmed.match(/^token=([^&#\s]+)/i);
  if (directTokenMatch && directTokenMatch[1]) {
    try {
      return decodeURIComponent(directTokenMatch[1]).trim();
    } catch {
      return directTokenMatch[1].trim();
    }
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsedUrl = new URL(trimmed);
      const token = parsedUrl.searchParams.get('token');
      if (token) return token.trim();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
