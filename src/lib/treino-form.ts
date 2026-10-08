import type { ExerciseCatalogItem, PlannedExercise } from '@/types/models';

export const LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 100 },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Item do formulário com chave estável — reordenar não muda a identidade do cartão. */
export interface FormExercise {
  key: string;
  exercise: PlannedExercise;
}

let keySeq = 0;
export function makeFormExercise(exercise: PlannedExercise): FormExercise {
  keySeq += 1;
  return { key: `fx-${keySeq}`, exercise };
}

export function plannedFromCatalog(item: ExerciseCatalogItem, order: number): PlannedExercise {
  return {
    exerciseId: item.id,
    exerciseName: item.name,
    muscleGroup: item.muscleGroup,
    order,
    targetSets: 3,
    repRangeMin: 8,
    repRangeMax: 12,
  };
}

export function withSets(exercise: PlannedExercise, value: number): PlannedExercise {
  return { ...exercise, targetSets: clamp(value, LIMITS.sets.min, LIMITS.sets.max) };
}

/** Subir o mínimo acima do máximo empurra o máximo junto, nunca fica uma faixa inválida. */
export function withRepMin(exercise: PlannedExercise, value: number): PlannedExercise {
  const repRangeMin = clamp(value, LIMITS.reps.min, LIMITS.reps.max);
  return { ...exercise, repRangeMin, repRangeMax: Math.max(exercise.repRangeMax, repRangeMin) };
}

/** Descer o máximo abaixo do mínimo para no mínimo. */
export function withRepMax(exercise: PlannedExercise, value: number): PlannedExercise {
  const repRangeMax = clamp(value, exercise.repRangeMin, LIMITS.reps.max);
  return { ...exercise, repRangeMax };
}

export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** Converte o estado do formulário no array salvo no Firestore, com `order` sequencial. */
export function toPlannedExercises(items: FormExercise[]): PlannedExercise[] {
  return items.map((item, order) => ({ ...item.exercise, order }));
}
