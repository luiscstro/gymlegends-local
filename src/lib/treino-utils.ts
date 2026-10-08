import type { Treino } from '@/types/models';

/** Junta os 1-2 grupos musculares mais presentes no treino (ex: "Peito e Tríceps"). */
export function treinoMuscleGroupSummary(treino: Treino): string {
  const groups: string[] = [];
  for (const exercise of treino.exercises) {
    const group = exercise.muscleGroup ?? 'Geral';
    if (!groups.includes(group)) groups.push(group);
  }
  if (groups.length === 0) return '';
  if (groups.length === 1) return groups[0];
  return `${groups.slice(0, -1).join(', ')} e ${groups[groups.length - 1]}`;
}

/** Estimativa grosseira: ~2,5 min por série planejada (execução + descanso). */
export function estimateTreinoDurationMinutes(treino: Treino): number {
  const totalSets = treino.exercises.reduce((sum, e) => sum + e.targetSets, 0);
  return Math.round(totalSets * 2.5);
}

const WEEKDAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function weekdaysAbbreviation(weekdays: number[]): string {
  if (weekdays.length === 0) return '—';
  return [...weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_ABBR[d]).join(' · ');
}
