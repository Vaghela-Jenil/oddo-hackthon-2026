const TEXT_PATTERN = /^[a-zA-Z0-9\s\-_/().,&]+$/;

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidLabel(value: string, min = 2, max = 80): boolean {
  const sanitized = sanitizeText(value);
  if (sanitized.length < min || sanitized.length > max) return false;
  return TEXT_PATTERN.test(sanitized);
}

export function isValidSku(value: string): boolean {
  return /^[A-Z0-9][A-Z0-9\-]{2,31}$/.test(value.trim().toUpperCase());
}

export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
