import { listExerciseCatalog, seedExerciseCatalogIfEmpty } from '@/lib/data/exercise-catalog';
import type { ExerciseCatalogItem } from '@/types/models';

/**
 * Cache do catálogo em memória, compartilhado por todas as aberturas da busca.
 * Antes, cada abertura fazia duas leituras completas do Firestore em sequência (seed + lista)
 * e voltava a mostrar o skeleton. Agora a busca mostra o cache na hora e atualiza em segundo plano.
 */
let cache: ExerciseCatalogItem[] | null = null;
let inflight: Promise<ExerciseCatalogItem[]> | null = null;

export function getCachedExerciseCatalog(): ExerciseCatalogItem[] | null {
  return cache;
}

/** Busca o catálogo (uma consulta; o seed só roda se não houver exercícios do sistema). Chamadas simultâneas compartilham a mesma requisição. */
export function loadExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
  if (inflight) return inflight;
  inflight = (async () => {
    let items = await listExerciseCatalog();
    if (!items.some((item) => item.createdBy === 'system')) {
      await seedExerciseCatalogIfEmpty();
      items = await listExerciseCatalog();
    }
    cache = items;
    return items;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Inclui um exercício recém-criado no cache, sem precisar reler o catálogo. */
export function rememberExercise(item: ExerciseCatalogItem) {
  if (cache && !cache.some((existing) => existing.id === item.id)) cache = [...cache, item];
}

/** Só para testes. */
export function resetExerciseCatalogCache() {
  cache = null;
  inflight = null;
}
