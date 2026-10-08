import { getState } from '@/lib/data/local-db';
import { subscribeSelect } from '@/lib/data/select';
import type { WorkoutSession } from '@/types/models';

export function subscribeToCompletedSessions(
  uid: string,
  callback: (sessions: WorkoutSession[]) => void
): () => void {
  return subscribeSelect(
    (s) =>
      s.sessions
        .filter((session) => session.ownerUid === uid && session.status === 'completed')
        .sort((a, b) => b.startedAt - a.startedAt),
    callback
  );
}

export interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
}

/** Exercícios distintos já registrados, do mais recente para o mais antigo. */
export async function listLoggedExercises(uid: string): Promise<ExerciseSummary[]> {
  void uid;
  const sets = [...getState().loggedSets].sort((a, b) => b.loggedAt - a.loggedAt);
  const seen = new Map<string, string>();
  for (const set of sets) {
    if (!seen.has(set.exerciseId)) seen.set(set.exerciseId, set.exerciseNameSnapshot);
  }
  return Array.from(seen.entries()).map(([exerciseId, exerciseName]) => ({ exerciseId, exerciseName }));
}

export interface ExerciseSessionPoint {
  sessionId: string;
  date: number;
  maxWeight: number;
  repsAtMaxWeight: number;
}

/** Para cada sessão em que o exercício apareceu, pega a maior carga usada (vira um ponto no gráfico). */
export async function listExerciseProgress(uid: string, exerciseId: string): Promise<ExerciseSessionPoint[]> {
  void uid;
  const sets = getState()
    .loggedSets.filter((set) => set.exerciseId === exerciseId)
    .sort((a, b) => a.loggedAt - b.loggedAt);

  const bySession = new Map<string, ExerciseSessionPoint>();
  for (const set of sets) {
    const existing = bySession.get(set.sessionId);
    if (!existing || set.weight > existing.maxWeight) {
      bySession.set(set.sessionId, {
        sessionId: set.sessionId,
        date: set.loggedAt,
        maxWeight: set.weight,
        repsAtMaxWeight: set.reps,
      });
    }
  }
  return Array.from(bySession.values()).sort((a, b) => a.date - b.date);
}
