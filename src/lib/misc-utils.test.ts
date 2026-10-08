import { describe, expect, it } from 'vitest';

import type { ExerciseSessionPoint } from '@/lib/data/history';
import { nextSetType, SET_TYPE_ORDER, type Treino } from '@/types/models';

import { dayMonthAbbr, durationMinutes, monthGroupLabel, monthKey, shortDate } from './date-utils';
import { filterByRange, maxWeightOf, weightTrend } from './progress-utils';
import { formatElapsed, formatTime } from './time-utils';
import { estimateTreinoDurationMinutes, treinoMuscleGroupSummary, weekdaysAbbreviation } from './treino-utils';

const DAY = 24 * 60 * 60 * 1000;

describe('time-utils', () => {
  it('formatTime', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(90.9)).toBe('1:30');
    expect(formatTime(-5)).toBe('0:00');
  });

  it('formatElapsed', () => {
    expect(formatElapsed(0)).toBe('00:00:00');
    expect(formatElapsed(3725)).toBe('01:02:05');
    expect(formatElapsed(-1)).toBe('00:00:00');
  });
});

describe('date-utils', () => {
  const march = new Date(2026, 2, 5, 10).getTime();

  it('formatos curtos', () => {
    expect(dayMonthAbbr(march)).toEqual({ day: '05', month: 'Mar' });
    expect(shortDate(march)).toBe('05 Mar');
  });

  it('grupo de mês mostra o ano só quando não é o ano atual', () => {
    expect(monthGroupLabel(march, new Date(2026, 9, 1).getTime())).toBe('MARÇO');
    expect(monthGroupLabel(march, new Date(2027, 0, 1).getTime())).toBe('MARÇO DE 2026');
  });

  it('chave de mês separa anos', () => {
    expect(monthKey(march)).not.toBe(monthKey(new Date(2025, 2, 5).getTime()));
  });

  it('duração em minutos', () => {
    expect(durationMinutes(0, 45 * 60000)).toBe(45);
    expect(durationMinutes(0, null)).toBe(0);
    expect(durationMinutes(1000, 0)).toBe(0);
  });
});

describe('treino-utils', () => {
  const treino: Treino = {
    id: 't',
    name: 'Treino A',
    order: 0,
    weekdays: [5, 1, 3],
    exercises: [
      { exerciseId: '1', exerciseName: 'Supino', muscleGroup: 'Peito', order: 0, targetSets: 4, repRangeMin: 8, repRangeMax: 12 },
      { exerciseId: '2', exerciseName: 'Crucifixo', muscleGroup: 'Peito', order: 1, targetSets: 3, repRangeMin: 8, repRangeMax: 12 },
      { exerciseId: '3', exerciseName: 'Pulley', muscleGroup: 'Tríceps', order: 2, targetSets: 3, repRangeMin: 8, repRangeMax: 12 },
    ],
  };

  it('resumo de grupos', () => {
    expect(treinoMuscleGroupSummary(treino)).toBe('Peito e Tríceps');
    expect(treinoMuscleGroupSummary({ ...treino, exercises: [] })).toBe('');
  });

  it('duração estimada', () => {
    expect(estimateTreinoDurationMinutes(treino)).toBe(25);
  });

  it('dias em ordem numérica', () => {
    expect(weekdaysAbbreviation(treino.weekdays)).toBe('Seg · Qua · Sex');
    expect(weekdaysAbbreviation([])).toBe('—');
  });
});

describe('nextSetType', () => {
  it('cicla por todos os tipos e volta ao início', () => {
    let current = SET_TYPE_ORDER[0];
    const seen = [current];
    for (let i = 0; i < SET_TYPE_ORDER.length; i++) {
      current = nextSetType(current);
      seen.push(current);
    }
    expect(seen.slice(0, -1)).toEqual(SET_TYPE_ORDER);
    expect(seen.at(-1)).toBe(SET_TYPE_ORDER[0]);
  });
});

describe('progress-utils', () => {
  const now = 1_000 * DAY;
  const points: ExerciseSessionPoint[] = [
    { sessionId: 'a', date: now - 120 * DAY, maxWeight: 40, repsAtMaxWeight: 10 },
    { sessionId: 'b', date: now - 60 * DAY, maxWeight: 45, repsAtMaxWeight: 8 },
    { sessionId: 'c', date: now - 10 * DAY, maxWeight: 47.5, repsAtMaxWeight: 8 },
  ];

  it('filtra por período', () => {
    expect(filterByRange(points, '1M', now).map((p) => p.sessionId)).toEqual(['c']);
    expect(filterByRange(points, '3M', now).map((p) => p.sessionId)).toEqual(['b', 'c']);
    expect(filterByRange(points, 'all', now)).toHaveLength(3);
  });

  it('carga máxima', () => {
    expect(maxWeightOf(points)).toBe(47.5);
    expect(maxWeightOf([])).toBe(0);
  });

  it('tendência', () => {
    expect(weightTrend(points)).toEqual({ delta: 7.5, weeks: 16 });
    expect(weightTrend(points.slice(0, 1))).toBeNull();
  });

  it('tendência arredonda erro de ponto flutuante', () => {
    const t = weightTrend([
      { sessionId: 'x', date: 0, maxWeight: 0.1, repsAtMaxWeight: 1 },
      { sessionId: 'y', date: DAY, maxWeight: 0.3, repsAtMaxWeight: 1 },
    ]);
    expect(t).toEqual({ delta: 0.2, weeks: 1 });
  });
});
