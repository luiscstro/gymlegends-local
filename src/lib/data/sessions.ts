import { lastPerformanceDocId } from '@/lib/data/last-performance';
import { newId, update, type StoredLoggedSet } from '@/lib/data/local-db';
import { subscribeSelect } from '@/lib/data/select';
import type { LoggedSet, SetType, WorkoutSession } from '@/types/models';

export function toLoggedSet(stored: StoredLoggedSet): LoggedSet {
  const { sessionId, ...set } = stored;
  void sessionId;
  return set;
}

export async function startSession(
  uid: string,
  routineId: string,
  treinoId: string,
  treinoName: string
): Promise<string> {
  const session: WorkoutSession = {
    id: newId(),
    ownerUid: uid,
    routineId,
    treinoId,
    treinoNameSnapshot: treinoName,
    status: 'in_progress',
    startedAt: Date.now(),
    completedAt: null,
    exerciseCount: 0,
  };
  update((s) => ({ ...s, sessions: [...s.sessions, session] }));
  return session.id;
}

export async function finishSession(sessionId: string, exerciseCount: number) {
  update((s) => ({
    ...s,
    sessions: s.sessions.map((session) =>
      session.id === sessionId
        ? { ...session, status: 'completed' as const, completedAt: Date.now(), exerciseCount }
        : session
    ),
  }));
}

export function subscribeToLoggedSets(
  sessionId: string,
  uid: string,
  callback: (sets: LoggedSet[]) => void
): () => void {
  void uid;
  return subscribeSelect(
    (s) => s.loggedSets.filter((set) => set.sessionId === sessionId).sort((a, b) => a.loggedAt - b.loggedAt),
    (stored) => callback(stored.map(toLoggedSet))
  );
}

interface LogSetInput {
  uid: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setType: SetType;
  setPosition: number;
  weight: number;
  reps: number;
}

/** Grava a série e o "última vez" na mesma escrita, para nunca ficarem fora de sincronia. */
export async function logSet(input: LogSetInput): Promise<string> {
  const now = Date.now();
  const set: StoredLoggedSet = {
    id: newId(),
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    exerciseNameSnapshot: input.exerciseName,
    setType: input.setType,
    setPosition: input.setPosition,
    weight: input.weight,
    reps: input.reps,
    restTakenSeconds: null,
    loggedAt: now,
  };
  const key = lastPerformanceDocId(input.uid, input.exerciseId, input.setType, input.setPosition);
  update((s) => ({
    ...s,
    loggedSets: [...s.loggedSets, set],
    lastPerformance: {
      ...s.lastPerformance,
      [key]: {
        exerciseId: input.exerciseId,
        setType: input.setType,
        setPosition: input.setPosition,
        weight: input.weight,
        reps: input.reps,
        restTakenSeconds: null,
        sessionId: input.sessionId,
        loggedAt: now,
      },
    },
  }));
  return set.id;
}

export async function deleteLoggedSet(sessionId: string, setId: string) {
  update((s) => ({
    ...s,
    loggedSets: s.loggedSets.filter((set) => !(set.id === setId && set.sessionId === sessionId)),
  }));
}

interface RecordRestInput {
  uid: string;
  sessionId: string;
  setId: string;
  exerciseId: string;
  setType: SetType;
  setPosition: number;
  restTakenSeconds: number;
}

/** O descanso só é conhecido depois do cronômetro: atualiza a série e o "última vez". */
export async function recordRestTaken(input: RecordRestInput) {
  const key = lastPerformanceDocId(input.uid, input.exerciseId, input.setType, input.setPosition);
  update((s) => {
    const last = s.lastPerformance[key];
    return {
      ...s,
      loggedSets: s.loggedSets.map((set) =>
        set.id === input.setId ? { ...set, restTakenSeconds: input.restTakenSeconds } : set
      ),
      lastPerformance:
        last && last.sessionId === input.sessionId
          ? { ...s.lastPerformance, [key]: { ...last, restTakenSeconds: input.restTakenSeconds } }
          : s.lastPerformance,
    };
  });
}
