const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function dayMonthAbbr(timestamp: number) {
  const date = new Date(timestamp);
  return { day: date.getDate().toString().padStart(2, '0'), month: MONTH_ABBR[date.getMonth()] };
}

/** "MARÇO" no ano corrente, "MARÇO DE 2025" em anos anteriores — evita juntar meses de anos diferentes. */
export function monthGroupLabel(timestamp: number, now: number = Date.now()) {
  const date = new Date(timestamp);
  const label = MONTH_FULL[date.getMonth()].toUpperCase();
  return date.getFullYear() === new Date(now).getFullYear() ? label : `${label} DE ${date.getFullYear()}`;
}

export function monthKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function shortDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getDate().toString().padStart(2, '0')} ${MONTH_ABBR[date.getMonth()]}`;
}

export function durationMinutes(startedAt: number, completedAt: number | null) {
  if (!completedAt) return 0;
  return Math.max(0, Math.round((completedAt - startedAt) / 60000));
}
