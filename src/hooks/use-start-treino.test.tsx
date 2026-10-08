import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Treino } from '@/types/models';

const navigate = vi.fn();
const startSession = vi.fn<(...args: unknown[]) => Promise<string>>();

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/lib/data/sessions', () => ({ startSession: (...args: unknown[]) => startSession(...args) }));
vi.mock('@/providers/auth-provider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('@/providers/routine-provider', () => ({ useRoutine: () => ({ routine: { id: 'r1' } }) }));

const { useStartTreino } = await import('./use-start-treino');

const treino: Treino = {
  id: 't1',
  name: 'Treino A',
  order: 0,
  weekdays: [1],
  exercises: [{ exerciseId: 'e', exerciseName: 'Supino', order: 0, targetSets: 3, repRangeMin: 8, repRangeMax: 12 }],
};

beforeEach(() => {
  navigate.mockReset();
  startSession.mockReset();
});

describe('useStartTreino', () => {
  it('toque duplo cria uma sessão só', async () => {
    let resolve!: (id: string) => void;
    startSession.mockImplementation(() => new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useStartTreino());

    await act(async () => {
      void result.current.start(treino);
      void result.current.start(treino);
    });
    expect(result.current.startingId).toBe('t1');
    await act(async () => resolve('s1'));

    expect(startSession).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/session/s1?treinoId=t1');
  });

  it('erro libera para tentar de novo', async () => {
    startSession.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('s2');
    const { result } = renderHook(() => useStartTreino());

    await act(() => result.current.start(treino));
    expect(result.current.error).toMatch(/Não foi possível iniciar/);
    expect(result.current.startingId).toBeNull();

    await act(() => result.current.start(treino));
    expect(navigate).toHaveBeenCalledWith('/session/s2?treinoId=t1');
  });

  it('treino sem exercícios não inicia', async () => {
    const { result } = renderHook(() => useStartTreino());
    await act(() => result.current.start({ ...treino, exercises: [] }));
    expect(startSession).not.toHaveBeenCalled();
  });
});
