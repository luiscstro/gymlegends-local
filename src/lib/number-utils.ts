/** Mantém só dígitos e um separador decimal (vírgula ou ponto), até 4 inteiros e 2 decimais. */
export function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.,]/g, '');
  const sepIndex = cleaned.search(/[.,]/);
  if (sepIndex === -1) return cleaned.slice(0, 4);
  const intPart = cleaned.slice(0, sepIndex).slice(0, 4);
  const decPart = cleaned
    .slice(sepIndex + 1)
    .replace(/[.,]/g, '')
    .slice(0, 2);
  return `${intPart}${cleaned[sepIndex]}${decPart}`;
}

/** Só dígitos, no máximo 3 (ninguém faz 1000 repetições numa série). */
export function sanitizeInt(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

/** Converte "42,5" ou "42.5" em 42.5; retorna null se não for um número positivo. */
export function parsePositiveNumber(value: string): number | null {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** 42.5 -> "42,5"; 40 -> "40". Formato brasileiro, sem zeros à toa. */
export function formatWeight(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace('.', ',');
}
