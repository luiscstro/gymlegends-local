import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExerciseCatalogItem } from '@/types/models';

const CATALOG: ExerciseCatalogItem[] = [
  { id: 'supino', name: 'Supino Reto', muscleGroup: 'Peito', createdBy: 'system' },
  { id: 'cruci', name: 'Crucifixo', muscleGroup: 'Peito', createdBy: 'system' },
  { id: 'triceps', name: 'Tríceps Pulley', muscleGroup: 'Tríceps', createdBy: 'system' },
  { id: 'remada', name: 'Remada Baixa', muscleGroup: 'Costas', createdBy: 'system' },
];

const listExerciseCatalog = vi.fn<() => Promise<ExerciseCatalogItem[]>>();
const addCustomExercise = vi.fn<(...args: unknown[]) => Promise<string>>();

vi.mock('@/lib/data/exercise-catalog', () => ({
  seedExerciseCatalogIfEmpty: () => Promise.resolve(),
  listExerciseCatalog: () => listExerciseCatalog(),
  addCustomExercise: (...args: unknown[]) => addCustomExercise(...args),
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

const { ExercisePickerModal } = await import('./exercise-picker-modal');
const { resetExerciseCatalogCache } = await import('@/lib/exercise-catalog-store');

function setup(props: Partial<Parameters<typeof ExercisePickerModal>[0]> = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const user = userEvent.setup();
  const utils = render(<ExercisePickerModal open onClose={onClose} onSelect={onSelect} {...props} />);
  return { ...utils, user, onClose, onSelect };
}

beforeEach(() => {
  resetExerciseCatalogCache();
  listExerciseCatalog.mockReset().mockResolvedValue(CATALOG);
  addCustomExercise.mockReset().mockResolvedValue('new-id');
  document.body.removeAttribute('style');
});

describe('ExercisePickerModal', () => {
  it('renderiza no body (portal), fora de containers com transform', async () => {
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
    expect(await screen.findByRole('dialog', { name: 'Escolher exercício' })).toBeInTheDocument();
  });

  it('agrupa por músculo na ordem de treino', async () => {
    setup();
    await screen.findByText('Supino Reto');
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['PEITO', 'COSTAS', 'TRÍCEPS']);
  });

  it('busca ignora acento e caixa', async () => {
    const { user } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'TRICEPS');
    expect(screen.getByText('Tríceps Pulley')).toBeInTheDocument();
    expect(screen.queryByText('Supino Reto')).not.toBeInTheDocument();
  });

  it('campo de busca fica no topo, antes da lista (teclado não cobre)', async () => {
    setup();
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('Buscar exercício');
    const firstItem = await within(dialog).findByText('Crucifixo');
    expect(input.compareDocumentPosition(firstItem) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('limpar busca restaura a lista', async () => {
    const { user } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'remada');
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(screen.getByLabelText('Buscar exercício')).toHaveValue('');
    expect(screen.getByText('Supino Reto')).toBeInTheDocument();
  });

  it('selecionar chama onSelect com o item', async () => {
    const { user, onSelect } = setup();
    await user.click(await screen.findByText('Crucifixo'));
    expect(onSelect).toHaveBeenCalledWith(CATALOG[1]);
  });

  it('marca exercícios que já estão no treino', async () => {
    setup({ selectedIds: ['remada'] });
    const row = (await screen.findByText('Remada Baixa')).closest('button')!;
    expect(within(row).getByText('no treino')).toBeInTheDocument();
  });

  it('oferece criar exercício quando não existe, e cria', async () => {
    const { user, onSelect } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'Panturrilha Sentado');
    expect(screen.getByText(/Nenhum exercício com esse nome/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Criar exercício/ }));
    expect(addCustomExercise).toHaveBeenCalledWith('Panturrilha Sentado', 'Personalizado', 'u1');
    expect(onSelect).toHaveBeenCalledWith({
      id: 'new-id',
      name: 'Panturrilha Sentado',
      muscleGroup: 'Personalizado',
      createdBy: 'u1',
    });
  });

  it('não oferece criar quando o nome já existe (com ou sem acento)', async () => {
    const { user } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'triceps pulley');
    expect(screen.queryByRole('button', { name: /Criar exercício/ })).not.toBeInTheDocument();
  });

  it('não oferece criar com menos de 2 letras', async () => {
    const { user } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'x');
    expect(screen.queryByRole('button', { name: /Criar exercício/ })).not.toBeInTheDocument();
  });

  it('erro ao criar mostra alerta', async () => {
    addCustomExercise.mockRejectedValue(new Error('offline'));
    const { user, onSelect } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'Novo exercício');
    await user.click(screen.getByRole('button', { name: /Criar exercício/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível criar');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('erro ao carregar mostra mensagem', async () => {
    listExerciseCatalog.mockRejectedValue(new Error('offline'));
    setup();
    expect(await screen.findByText(/Não foi possível carregar os exercícios/)).toBeInTheDocument();
  });

  it('Esc, botão fechar e clique no fundo fecham', async () => {
    const { user, onClose } = setup();
    const dialog = await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    await user.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('clique dentro do diálogo não fecha', async () => {
    const { user, onClose } = setup();
    await user.click(await screen.findByRole('heading', { name: 'Escolher exercício' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('trava o scroll do fundo enquanto aberto e libera ao fechar', async () => {
    const { rerender, onClose, onSelect } = setup();
    await screen.findByRole('dialog');
    expect(document.body.style.position).toBe('fixed');
    rerender(<ExercisePickerModal open={false} onClose={onClose} onSelect={onSelect} />);
    await waitFor(() => expect(document.body.style.position).toBe(''));
  });

  it('ao reabrir, a busca anterior é limpa', async () => {
    const { user, rerender, onClose, onSelect } = setup();
    await screen.findByText('Supino Reto');
    await user.type(screen.getByLabelText('Buscar exercício'), 'remada');
    rerender(<ExercisePickerModal open={false} onClose={onClose} onSelect={onSelect} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<ExercisePickerModal open onClose={onClose} onSelect={onSelect} />);
    expect(await screen.findByLabelText('Buscar exercício')).toHaveValue('');
  });

  it('reabrir mostra a lista na hora, sem skeleton, e atualiza em segundo plano', async () => {
    const { rerender, onClose, onSelect } = setup();
    await screen.findByText('Supino Reto');
    rerender(<ExercisePickerModal open={false} onClose={onClose} onSelect={onSelect} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    let resolveRefresh!: (items: ExerciseCatalogItem[]) => void;
    listExerciseCatalog.mockImplementationOnce(() => new Promise((r) => (resolveRefresh = r)));
    rerender(<ExercisePickerModal open onClose={onClose} onSelect={onSelect} />);

    // Lista do cache aparece imediatamente, mesmo com a atualização ainda pendente
    expect(screen.getByText('Supino Reto')).toBeInTheDocument();
    expect(document.querySelector('.skeleton')).toBeNull();

    resolveRefresh([...CATALOG, { id: 'novo', name: 'Agachamento', muscleGroup: 'Pernas', createdBy: 'system' }]);
    expect(await screen.findByText('Agachamento')).toBeInTheDocument();
  });

  it('falha ao atualizar em segundo plano mantém a lista do cache', async () => {
    const { rerender, onClose, onSelect } = setup();
    await screen.findByText('Supino Reto');
    rerender(<ExercisePickerModal open={false} onClose={onClose} onSelect={onSelect} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    listExerciseCatalog.mockRejectedValueOnce(new Error('offline'));
    rerender(<ExercisePickerModal open onClose={onClose} onSelect={onSelect} />);
    await waitFor(() => expect(listExerciseCatalog).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Supino Reto')).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar/)).not.toBeInTheDocument();
  });
});
