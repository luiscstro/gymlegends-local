import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTreino } from '@/lib/data/routines';
import { exportBackup, getState, resetLocalDbForTests } from '@/lib/data/local-db';

import DataPage from './data';

const assign = vi.fn();

beforeEach(() => {
  localStorage.clear();
  resetLocalDbForTests();
  assign.mockReset();
  vi.stubGlobal('location', { ...window.location, assign });
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
});

describe('DataPage', () => {
  it('mostra o resumo e avisa que não há backup', async () => {
    await createTreino('r1', 'Treino A', 0);
    render(<DataPage />);
    expect(screen.getByText('Treinos').previousSibling).toHaveTextContent('1');
    expect(screen.getByText(/ainda não fez nenhum backup/)).toBeInTheDocument();
  });

  it('exportar gera o arquivo e lembra a data', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<DataPage />);
    await userEvent.setup().click(screen.getByRole('button', { name: /Exportar backup/ }));
    expect(click).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Backup gerado');
    expect(screen.getByText(/Último backup/)).toBeInTheDocument();
  });

  it('importar substitui os dados e recarrega o app', async () => {
    await createTreino('r1', 'Do backup', 0);
    const file = new File([exportBackup()], 'backup.json', { type: 'application/json' });
    localStorage.clear();
    resetLocalDbForTests();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DataPage />);
    await userEvent.setup().upload(screen.getByTestId('backup-input'), file);
    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(getState().treinos.map((t) => t.name)).toEqual(['Do backup']);
  });

  it('arquivo inválido mostra erro e não recarrega', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DataPage />);
    await userEvent
      .setup()
      .upload(screen.getByTestId('backup-input'), new File(['oi'], 'x.json', { type: 'application/json' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('não é um backup');
    expect(assign).not.toHaveBeenCalled();
  });

  it('apagar pede confirmação duas vezes', async () => {
    await createTreino('r1', 'Treino A', 0);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValueOnce(false);
    render(<DataPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Apagar todos os dados/ }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(getState().treinos).toHaveLength(1);

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /Apagar todos os dados/ }));
    expect(getState().treinos).toHaveLength(0);
    expect(assign).toHaveBeenCalled();
  });
});
