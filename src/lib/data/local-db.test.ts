import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedExerciseCatalogIfEmpty, addCustomExercise, listExerciseCatalog } from './exercise-catalog';
import { listExerciseProgress, listLoggedExercises, subscribeToCompletedSessions } from './history';
import { getLastPerformance } from './last-performance';
import {
  backupFileName,
  backupSummary,
  clearAllData,
  exportBackup,
  getState,
  importBackup,
  InvalidBackupError,
  LOCAL_UID,
  resetLocalDbForTests,
  STORAGE_KEY,
  StorageFullError,
  subscribe,
  update,
} from './local-db';
import { createTreino, deleteTreino, getOrCreateActiveRoutine, subscribeToTreinos, updateTreino } from './routines';
import { deleteLoggedSet, finishSession, logSet, recordRestTaken, startSession, subscribeToLoggedSets } from './sessions';

beforeEach(() => {
  localStorage.clear();
  resetLocalDbForTests();
});

const uid = LOCAL_UID;

async function sessionWithSet(weight = 40, reps = 10) {
  const sessionId = await startSession(uid, 'r', 't', 'Treino A');
  const setId = await logSet({
    uid,
    sessionId,
    exerciseId: 'supino',
    exerciseName: 'Supino',
    setType: 'work',
    setPosition: 1,
    weight,
    reps,
  });
  return { sessionId, setId };
}

describe('armazenamento', () => {
  it('persiste no localStorage e recarrega', async () => {
    await createTreino('r1', 'Treino A', 0);
    resetLocalDbForTests();
    expect(getState().treinos.map((t) => t.name)).toEqual(['Treino A']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).treinos).toHaveLength(1);
  });

  it('JSON corrompido não quebra o app', () => {
    localStorage.setItem(STORAGE_KEY, '{quebrado');
    expect(getState().treinos).toEqual([]);
  });

  it('armazenamento cheio vira StorageFullError e não altera o estado', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('exceeded', 'QuotaExceededError');
    });
    expect(() => update((s) => ({ ...s, treinos: [] }))).toThrow(StorageFullError);
    expect(getState().routines).toEqual([]);
  });

  it('subscribe recebe o estado atual e cada mudança', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    await createTreino('r1', 'A', 0);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await createTreino('r1', 'B', 1);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('mudança feita em outra aba é refletida', () => {
    const listener = vi.fn();
    subscribe(listener);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ treinos: [{ id: 'x', routineId: 'r', name: 'Outra aba', order: 0, weekdays: [], exercises: [] }] }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ treinos: [expect.objectContaining({ name: 'Outra aba' })] }));
  });
});

describe('rotina e treinos', () => {
  it('cria a rotina uma vez só', async () => {
    const a = await getOrCreateActiveRoutine(uid);
    const b = await getOrCreateActiveRoutine(uid);
    expect(a.id).toBe(b.id);
    expect(getState().routines).toHaveLength(1);
  });

  it('cria, ordena, edita e exclui treinos', async () => {
    const seen: string[][] = [];
    subscribeToTreinos('r1', (treinos) => seen.push(treinos.map((t) => t.name)));
    const b = await createTreino('r1', 'B', 1);
    await createTreino('r1', 'A', 0);
    await createTreino('outra', 'Outra rotina', 0);
    expect(seen.at(-1)).toEqual(['A', 'B']);

    await updateTreino('r1', b, { name: 'B2', weekdays: [1, 3] });
    expect(seen.at(-1)).toEqual(['A', 'B2']);
    await deleteTreino('r1', b);
    expect(seen.at(-1)).toEqual(['A']);
  });

  it('treino entregue para as telas não carrega o campo interno routineId', async () => {
    let first: object | undefined;
    subscribeToTreinos('r1', (treinos) => (first = treinos[0]));
    await createTreino('r1', 'A', 0);
    expect(first).not.toHaveProperty('routineId');
  });

  it('mudanças em sessões não re-disparam a lista de treinos', async () => {
    const callback = vi.fn();
    subscribeToTreinos('r1', callback);
    await createTreino('r1', 'A', 0);
    const calls = callback.mock.calls.length;
    await sessionWithSet();
    expect(callback).toHaveBeenCalledTimes(calls);
  });
});

describe('sessões e séries', () => {
  it('registra série, atualiza "última vez" e lista em ordem', async () => {
    const { sessionId } = await sessionWithSet(42.5, 8);
    const sets: unknown[][] = [];
    subscribeToLoggedSets(sessionId, uid, (s) => sets.push(s));
    expect(sets.at(-1)).toEqual([expect.objectContaining({ weight: 42.5, reps: 8 })]);
    expect(sets.at(-1)![0]).not.toHaveProperty('sessionId');
    expect(await getLastPerformance(uid, 'supino', 'work', 1)).toMatchObject({ weight: 42.5, reps: 8, sessionId });
    expect(await getLastPerformance(uid, 'supino', 'top', 1)).toBeNull();
  });

  it('apagar a série remove da sessão', async () => {
    const { sessionId, setId } = await sessionWithSet();
    await deleteLoggedSet(sessionId, setId);
    let current: unknown[] = ['x'];
    subscribeToLoggedSets(sessionId, uid, (s) => (current = s));
    expect(current).toEqual([]);
  });

  it('descanso grava na série e no "última vez" da mesma sessão', async () => {
    const { sessionId, setId } = await sessionWithSet();
    await recordRestTaken({ uid, sessionId, setId, exerciseId: 'supino', setType: 'work', setPosition: 1, restTakenSeconds: 95 });
    expect(getState().loggedSets[0].restTakenSeconds).toBe(95);
    expect((await getLastPerformance(uid, 'supino', 'work', 1))?.restTakenSeconds).toBe(95);
  });

  it('finalizar move a sessão para o histórico, mais recente primeiro', async () => {
    const seen: string[][] = [];
    subscribeToCompletedSessions(uid, (s) => seen.push(s.map((x) => x.id)));
    const { sessionId: first } = await sessionWithSet();
    await finishSession(first, 1);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
    const { sessionId: second } = await sessionWithSet();
    await finishSession(second, 1);
    expect(seen.at(-1)).toEqual([second, first]);
    expect(getState().sessions.find((s) => s.id === first)).toMatchObject({ status: 'completed', exerciseCount: 1 });
  });

  it('histórico por exercício: maior carga por sessão', async () => {
    const { sessionId } = await sessionWithSet(40, 10);
    await logSet({ uid, sessionId, exerciseId: 'supino', exerciseName: 'Supino', setType: 'top', setPosition: 1, weight: 50, reps: 5 });
    const points = await listExerciseProgress(uid, 'supino');
    expect(points).toEqual([expect.objectContaining({ sessionId, maxWeight: 50, repsAtMaxWeight: 5 })]);
    expect(await listLoggedExercises(uid)).toEqual([{ exerciseId: 'supino', exerciseName: 'Supino' }]);
  });
});

describe('catálogo', () => {
  it('seed roda uma vez e exercícios criados entram na lista', async () => {
    await seedExerciseCatalogIfEmpty();
    const count = getState().exerciseCatalog.length;
    expect(count).toBeGreaterThan(40);
    await seedExerciseCatalogIfEmpty();
    expect(getState().exerciseCatalog).toHaveLength(count);

    const id = await addCustomExercise('  Meu Exercício ', '', uid);
    const list = await listExerciseCatalog();
    expect(list.find((e) => e.id === id)).toMatchObject({ name: 'Meu Exercício', muscleGroup: 'Outro', createdBy: uid });
  });
});

describe('backup', () => {
  it('exporta e importa os mesmos dados', async () => {
    await createTreino('r1', 'Treino A', 0);
    await sessionWithSet();
    const file = exportBackup(new Date('2026-10-07T12:00:00Z'));
    const before = getState();

    clearAllData();
    expect(backupSummary().treinos).toBe(0);

    importBackup(file);
    expect(getState().treinos).toEqual(before.treinos);
    expect(getState().loggedSets).toEqual(before.loggedSets);
    expect(JSON.parse(file)).toMatchObject({ app: 'gymlegends-local', exportedAt: '2026-10-07T12:00:00.000Z' });
  });

  it('rejeita arquivo que não é backup e não mexe nos dados', async () => {
    await createTreino('r1', 'Treino A', 0);
    expect(() => importBackup('não é json')).toThrow(InvalidBackupError);
    expect(() => importBackup(JSON.stringify({ app: 'outro', data: {} }))).toThrow(InvalidBackupError);
    expect(getState().treinos).toHaveLength(1);
  });

  it('backup antigo ou incompleto ganha as coleções que faltam', () => {
    importBackup(JSON.stringify({ app: 'gymlegends-local', version: 1, data: { treinos: [] } }));
    expect(getState()).toMatchObject({ sessions: [], loggedSets: [], lastPerformance: {}, exerciseCatalog: [] });
  });

  it('nome do arquivo com a data', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('gymlegends-backup-2026-01-05.json');
  });
});
