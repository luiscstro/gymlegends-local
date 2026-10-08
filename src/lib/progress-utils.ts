import type { ExerciseSessionPoint } from '@/lib/data/history';

export type Range = '1M' | '3M' | '6M' | 'all';

export const RANGES: { key: Range; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'all', label: 'Tudo' },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<Range, number | null> = { '1M': 30, '3M': 90, '6M': 180, all: null };

export function filterByRange(points: ExerciseSessionPoint[], range: Range, now: number): ExerciseSessionPoint[] {
  const days = RANGE_DAYS[range];
  if (!days) return points;
  const cutoff = now - days * DAY_MS;
  return points.filter((p) => p.date >= cutoff);
}

export function maxWeightOf(points: ExerciseSessionPoint[]): number {
  return points.reduce((max, p) => Math.max(max, p.maxWeight), 0);
}

/** Variação entre a primeira e a última sessão do período (pontos em ordem cronológica). */
export function weightTrend(points: ExerciseSessionPoint[]): { delta: number; weeks: number } | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = Math.round((last.maxWeight - first.maxWeight) * 100) / 100;
  const weeks = Math.max(1, Math.round((last.date - first.date) / (7 * DAY_MS)));
  return { delta, weeks };
}
