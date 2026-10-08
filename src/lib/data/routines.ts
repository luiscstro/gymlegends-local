import { getState, newId, update, type StoredTreino } from '@/lib/data/local-db';
import { subscribeSelect } from '@/lib/data/select';
import type { Routine, Treino } from '@/types/models';

export async function getOrCreateActiveRoutine(uid: string): Promise<Routine> {
  const existing = getState().routines.find((r) => r.ownerUid === uid && r.isActive);
  if (existing) return existing;

  const routine: Routine = { id: newId(), ownerUid: uid, name: 'Minha Rotina', isActive: true };
  update((s) => ({ ...s, routines: [...s.routines, routine] }));
  return routine;
}

function toTreino(stored: StoredTreino): Treino {
  const { routineId, ...treino } = stored;
  void routineId;
  return treino;
}

export function subscribeToTreinos(routineId: string, callback: (treinos: Treino[]) => void): () => void {
  return subscribeSelect(
    (s) => s.treinos.filter((t) => t.routineId === routineId).sort((a, b) => a.order - b.order),
    (stored) => callback(stored.map(toTreino))
  );
}

export async function createTreino(routineId: string, name: string, order: number): Promise<string> {
  const treino: StoredTreino = { id: newId(), routineId, name, order, weekdays: [], exercises: [] };
  update((s) => ({ ...s, treinos: [...s.treinos, treino] }));
  return treino.id;
}

export async function updateTreino(
  routineId: string,
  treinoId: string,
  data: Partial<Pick<Treino, 'name' | 'weekdays' | 'exercises'>>
) {
  update((s) => ({
    ...s,
    treinos: s.treinos.map((t) => (t.id === treinoId && t.routineId === routineId ? { ...t, ...data } : t)),
  }));
}

export async function deleteTreino(routineId: string, treinoId: string) {
  update((s) => ({ ...s, treinos: s.treinos.filter((t) => !(t.id === treinoId && t.routineId === routineId)) }));
}
