import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExerciseCatalogItem } from '@/types/models';

const listExerciseCatalog = vi.fn<() => Promise<ExerciseCatalogItem[]>>();
const seedExerciseCatalogIfEmpty = vi.fn<() => Promise<void>>();

vi.mock('@/lib/data/exercise-catalog', () => ({
  listExerciseCatalog: () => listExerciseCatalog(),
  seedExerciseCatalogIfEmpty: () => seedExerciseCatalogIfEmpty(),
}));

const { getCachedExerciseCatalog, loadExerciseCatalog, rememberExercise, resetExerciseCatalogCache } = await import(
  './exercise-catalog-store'
);

const SYSTEM: ExerciseCatalogItem = { id: 's', name: 'Supino', muscleGroup: 'Peito', createdBy: 'system' };
const CUSTOM: ExerciseCatalogItem = { id: 'c', name: 'Meu', muscleGroup: 'Personalizado', createdBy: 'u1' };

beforeEach(() => {
  resetExerciseCatalogCache();
  listExerciseCatalog.mockReset().mockResolvedValue([SYSTEM]);
  seedExerciseCatalogIfEmpty.mockReset().mockResolvedValue();
});

describe('exercise-catalog-store', () => {
  it('catálogo existente: uma consulta só, sem seed', async () => {
    expect(await loadExerciseCatalog()).toEqual([SYSTEM]);
    expect(listExerciseCatalog).toHaveBeenCalledTimes(1);
    expect(seedExerciseCatalogIfEmpty).not.toHaveBeenCalled();
    expect(getCachedExerciseCatalog()).toEqual([SYSTEM]);
  });

  it('sem exercícios do sistema: faz o seed e relê', async () => {
    listExerciseCatalog.mockResolvedValueOnce([CUSTOM]).mockResolvedValueOnce([SYSTEM, CUSTOM]);
    expect(await loadExerciseCatalog()).toEqual([SYSTEM, CUSTOM]);
    expect(seedExerciseCatalogIfEmpty).toHaveBeenCalledTimes(1);
    expect(listExerciseCatalog).toHaveBeenCalledTimes(2);
  });

  it('chamadas simultâneas compartilham a mesma requisição (pré-carga + abertura da busca)', async () => {
    const [a, b] = await Promise.all([loadExerciseCatalog(), loadExerciseCatalog()]);
    expect(a).toBe(b);
    expect(listExerciseCatalog).toHaveBeenCalledTimes(1);
  });

  it('erro não apaga o cache anterior e permite tentar de novo', async () => {
    await loadExerciseCatalog();
    listExerciseCatalog.mockRejectedValueOnce(new Error('offline'));
    await expect(loadExerciseCatalog()).rejects.toThrow('offline');
    expect(getCachedExerciseCatalog()).toEqual([SYSTEM]);
    await expect(loadExerciseCatalog()).resolves.toEqual([SYSTEM]);
  });

  it('rememberExercise inclui no cache sem duplicar', async () => {
    rememberExercise(CUSTOM);
    expect(getCachedExerciseCatalog()).toBeNull();
    await loadExerciseCatalog();
    rememberExercise(CUSTOM);
    rememberExercise(CUSTOM);
    expect(getCachedExerciseCatalog()).toEqual([SYSTEM, CUSTOM]);
  });
});
