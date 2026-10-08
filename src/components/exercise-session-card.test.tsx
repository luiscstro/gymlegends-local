import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LastPerformance, LoggedSet, PlannedExercise } from '@/types/models';

const getLastPerformance = vi.fn<(...args: unknown[]) => Promise<LastPerformance | null>>();
const deleteLoggedSet = vi.fn<(...args: unknown[]) => Promise<void>>();

vi.mock('@/lib/data/last-performance', () => ({
  getLastPerformance: (...args: unknown[]) => getLastPerformance(...args),
}));
vi.mock('@/lib/data/sessions', () => ({
  deleteLoggedSet: (...args: unknown[]) => deleteLoggedSet(...args),
}));

const { ExerciseSessionCard } = await import('./exercise-session-card');

const exercise: PlannedExercise = {
  exerciseId: 'supino',
  exerciseName: 'Supino Reto Articulado com um nome bem comprido para testar quebra',
  order: 0,
  targetSets: 2,
  repRangeMin: 8,
  repRangeMax: 12,
};

function setup(props: { loggedSets?: LoggedSet[]; onLogSet?: ReturnType<typeof vi.fn> } = {}) {
  const onLogSet = props.onLogSet ?? vi.fn().mockResolvedValue('set-1');
  const user = userEvent.setup();
  render(
    <ExerciseSessionCard
      exercise={exercise}
      loggedSets={props.loggedSets ?? []}
      uid="u1"
      sessionId="s1"
      onLogSet={onLogSet as never}
    />
  );
  return { user, onLogSet };
}

beforeEach(() => {
  getLastPerformance.mockReset().mockResolvedValue(null);
  deleteLoggedSet.mockReset().mockResolvedValue();
});

describe('ExerciseSessionCard', () => {
  it('cria uma linha por série planejada', () => {
    setup();
    expect(screen.getAllByLabelText(/Peso em kg/)).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Confirmar série' })).toHaveLength(2);
  });

  it('busca o "anterior" uma vez por posição, não a cada tecla', async () => {
    const { user } = setup();
    await waitFor(() => expect(getLastPerformance).toHaveBeenCalledTimes(2));
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '42,5');
    expect(getLastPerformance).toHaveBeenCalledTimes(2);
    expect(getLastPerformance).toHaveBeenNthCalledWith(1, 'u1', 'supino', 'work', 1);
    expect(getLastPerformance).toHaveBeenNthCalledWith(2, 'u1', 'supino', 'work', 2);
  });

  it('sanitiza peso e repetições', async () => {
    const { user } = setup();
    const weight = screen.getAllByLabelText(/Peso em kg/)[0];
    const reps = screen.getAllByLabelText(/Repetições/)[0];
    await user.type(weight, '12345,678kg');
    await user.type(reps, '1a2345');
    expect(weight).toHaveValue('1234,67');
    expect(reps).toHaveValue('123');
  });

  it('confirmar só habilita com peso e reps válidos', async () => {
    const { user } = setup();
    const confirm = screen.getAllByRole('button', { name: 'Confirmar série' })[0];
    expect(confirm).toBeDisabled();
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '40');
    expect(confirm).toBeDisabled();
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '10');
    expect(confirm).toBeEnabled();
  });

  it('confirma a série e vira linha somente leitura na hora', async () => {
    const { user, onLogSet } = setup();
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '42,5');
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '10');
    await user.click(screen.getAllByRole('button', { name: 'Confirmar série' })[0]);

    expect(onLogSet).toHaveBeenCalledWith('work', 1, 42.5, 10);
    expect(await screen.findByRole('button', { name: 'Desfazer série' })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Peso em kg/)).toHaveLength(1);
    expect(screen.getByText('42,5')).toBeInTheDocument();
  });

  it('Enter nas repetições confirma', async () => {
    const { user, onLogSet } = setup();
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '40');
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '8{Enter}');
    expect(onLogSet).toHaveBeenCalledTimes(1);
  });

  it('mostra erro se salvar falhar e mantém os valores', async () => {
    const onLogSet = vi.fn().mockRejectedValue(new Error('offline'));
    const { user } = setup({ onLogSet });
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '40');
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '8');
    await user.click(screen.getAllByRole('button', { name: 'Confirmar série' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não salvou');
    expect(screen.getAllByLabelText(/Peso em kg/)[0]).toHaveValue('40');
  });

  it('toque duplo no confirmar registra só uma vez', async () => {
    let resolve!: (id: string) => void;
    const onLogSet = vi.fn().mockImplementation(() => new Promise<string>((r) => (resolve = r)));
    const { user } = setup({ onLogSet });
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '40');
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '8');
    const confirm = screen.getAllByRole('button', { name: 'Confirmar série' })[0];
    await user.click(confirm);
    await user.click(confirm);
    resolve('set-1');
    await screen.findByRole('button', { name: 'Desfazer série' });
    expect(onLogSet).toHaveBeenCalledTimes(1);
  });

  it('desfazer remove a série e devolve a linha vazia', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = setup();
    await user.type(screen.getAllByLabelText(/Peso em kg/)[0], '40');
    await user.type(screen.getAllByLabelText(/Repetições/)[0], '8');
    await user.click(screen.getAllByRole('button', { name: 'Confirmar série' })[0]);
    await user.click(await screen.findByRole('button', { name: 'Desfazer série' }));

    expect(deleteLoggedSet).toHaveBeenCalledWith('s1', 'set-1');
    await waitFor(() => expect(screen.getAllByLabelText(/Peso em kg/)).toHaveLength(2));
    expect(screen.getAllByLabelText(/Peso em kg/)[0]).toHaveValue('');
  });

  it('cancelar o desfazer não apaga nada', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const logged: LoggedSet = {
      id: 'old',
      exerciseId: 'supino',
      exerciseNameSnapshot: 'Supino',
      setType: 'work',
      setPosition: 1,
      weight: 50,
      reps: 6,
      restTakenSeconds: null,
      loggedAt: 0,
    };
    const { user } = setup({ loggedSets: [logged] });
    await user.click(screen.getByRole('button', { name: 'Desfazer série' }));
    expect(deleteLoggedSet).not.toHaveBeenCalled();
  });

  it('séries já registradas aparecem e reduzem as linhas em branco', () => {
    const logged: LoggedSet = {
      id: 'old',
      exerciseId: 'supino',
      exerciseNameSnapshot: 'Supino',
      setType: 'work',
      setPosition: 1,
      weight: 50,
      reps: 6,
      restTakenSeconds: null,
      loggedAt: 0,
    };
    setup({ loggedSets: [logged] });
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Peso em kg/)).toHaveLength(1);
  });

  it('tocar no "anterior" preenche peso e reps', async () => {
    getLastPerformance.mockResolvedValue({
      exerciseId: 'supino',
      setType: 'work',
      setPosition: 1,
      weight: 37.5,
      reps: 9,
      restTakenSeconds: 90,
      sessionId: 'x',
      loggedAt: 0,
    });
    const { user } = setup();
    const [previous] = await screen.findAllByRole('button', { name: 'Repetir valores da última vez' });
    expect(previous).toHaveTextContent('37,5×9');
    await user.click(previous);
    expect(screen.getAllByLabelText(/Peso em kg/)[0]).toHaveValue('37,5');
    expect(screen.getAllByLabelText(/Repetições/)[0]).toHaveValue('9');
  });

  it('badge cicla o tipo de série e busca o anterior do novo tipo', async () => {
    const { user } = setup();
    const [badge] = screen.getAllByRole('button', { name: /Tipo de série: Work Set/ });
    await user.click(badge);
    expect(screen.getAllByRole('button', { name: /Tipo de série/ })[0]).toHaveAccessibleName(/Top Set/);
    await waitFor(() => expect(getLastPerformance).toHaveBeenCalledWith('u1', 'supino', 'top', 1));
  });

  it('adicionar série cria nova linha', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Adicionar série/ }));
    expect(screen.getAllByLabelText(/Peso em kg/)).toHaveLength(3);
  });
});
