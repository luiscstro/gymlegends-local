import { describe, expect, it } from 'vitest';

import type { PlannedExercise } from '@/types/models';

import {
  LIMITS,
  makeFormExercise,
  moveItem,
  plannedFromCatalog,
  removeAt,
  toPlannedExercises,
  withRepMax,
  withRepMin,
  withSets,
} from './treino-form';

const base: PlannedExercise = {
  exerciseId: 'supino',
  exerciseName: 'Supino',
  order: 0,
  targetSets: 3,
  repRangeMin: 8,
  repRangeMax: 12,
};

describe('plannedFromCatalog', () => {
  it('cria com padrão 3 × 8–12', () => {
    const planned = plannedFromCatalog({ id: 'x', name: 'Rosca', muscleGroup: 'Bíceps', createdBy: 'system' }, 4);
    expect(planned).toMatchObject({ exerciseId: 'x', exerciseName: 'Rosca', order: 4, targetSets: 3, repRangeMin: 8, repRangeMax: 12 });
  });
});

describe('limites de séries e repetições', () => {
  it('séries ficam entre os limites', () => {
    expect(withSets(base, 0).targetSets).toBe(LIMITS.sets.min);
    expect(withSets(base, 99).targetSets).toBe(LIMITS.sets.max);
    expect(withSets(base, 5).targetSets).toBe(5);
  });

  it('subir o mínimo acima do máximo empurra o máximo', () => {
    const next = withRepMin(base, 15);
    expect(next.repRangeMin).toBe(15);
    expect(next.repRangeMax).toBe(15);
  });

  it('mínimo não passa dos limites', () => {
    expect(withRepMin(base, 0).repRangeMin).toBe(LIMITS.reps.min);
    expect(withRepMin(base, 500).repRangeMin).toBe(LIMITS.reps.max);
  });

  it('máximo nunca fica abaixo do mínimo', () => {
    expect(withRepMax(base, 3).repRangeMax).toBe(8);
    expect(withRepMax(base, 500).repRangeMax).toBe(LIMITS.reps.max);
  });
});

describe('moveItem / removeAt', () => {
  it('troca com o vizinho', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
  });

  it('não mexe fora dos limites e devolve a mesma referência', () => {
    const list = ['a', 'b'];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
    expect(moveItem(list, 5, 1)).toBe(list);
  });

  it('não muta a lista original', () => {
    const list = ['a', 'b'];
    moveItem(list, 0, 1);
    expect(list).toEqual(['a', 'b']);
  });

  it('remove pelo índice', () => {
    expect(removeAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });
});

describe('makeFormExercise / toPlannedExercises', () => {
  it('chaves são únicas mesmo para o mesmo exercício', () => {
    const a = makeFormExercise(base);
    const b = makeFormExercise(base);
    expect(a.key).not.toBe(b.key);
  });

  it('renumera a ordem depois de reordenar', () => {
    const items = [makeFormExercise({ ...base, order: 7 }), makeFormExercise({ ...base, exerciseId: 'b', order: 2 })];
    const result = toPlannedExercises(moveItem(items, 0, 1));
    expect(result.map((e) => [e.exerciseId, e.order])).toEqual([
      ['b', 0],
      ['supino', 1],
    ]);
  });
});
