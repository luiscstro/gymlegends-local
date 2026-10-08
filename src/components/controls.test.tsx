import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useVisualViewport } from '@/hooks/use-visual-viewport';
import type { SetType } from '@/types/models';

import { SetTypeBadge } from './set-type-badge';
import { StartTreinoButton } from './start-treino-button';
import { Stepper } from './stepper';
import { WeekdayPicker } from './weekday-picker';

describe('Stepper', () => {
  function Harness({ initial, min, max }: { initial: number; min: number; max: number }) {
    const [value, setValue] = useState(initial);
    return <Stepper label="Séries" value={value} onChange={setValue} min={min} max={max} />;
  }

  it('incrementa e decrementa', async () => {
    const user = userEvent.setup();
    render(<Harness initial={3} min={1} max={5} />);
    await user.click(screen.getByRole('button', { name: 'Aumentar séries' }));
    expect(screen.getByText('4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Diminuir séries' }));
    await user.click(screen.getByRole('button', { name: 'Diminuir séries' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('desabilita nos limites', async () => {
    const user = userEvent.setup();
    render(<Harness initial={1} min={1} max={2} />);
    expect(screen.getByRole('button', { name: 'Diminuir séries' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Aumentar séries' }));
    expect(screen.getByRole('button', { name: 'Aumentar séries' })).toBeDisabled();
  });
});

describe('WeekdayPicker', () => {
  it('alterna dias e mantém ordem numérica', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<WeekdayPicker value={[5]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Segunda' }));
    expect(onChange).toHaveBeenLastCalledWith([1, 5]);

    rerender(<WeekdayPicker value={[1, 5]} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Segunda' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Sexta' }));
    expect(onChange).toHaveBeenLastCalledWith([1]);
  });

  it('tem 7 botões com nomes completos (letras repetidas não confundem)', () => {
    render(<WeekdayPicker value={[]} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Sábado' })).toBeInTheDocument();
  });
});

describe('SetTypeBadge', () => {
  it('mostra a letra e nome acessível', () => {
    render(<SetTypeBadge setType={'warmup' as SetType} onClick={() => {}} />);
    const badge = screen.getByRole('button', { name: /Aquecimento/ });
    expect(badge).toHaveTextContent('A');
    expect(badge).toBeEnabled();
  });

  it('sem onClick é só leitura', () => {
    render(<SetTypeBadge setType="top" />);
    expect(screen.getByRole('button', { name: 'Top Set' })).toBeDisabled();
  });
});

describe('StartTreinoButton', () => {
  it('estado vazio explica o que fazer', () => {
    render(<StartTreinoButton exerciseCount={0} starting={false} onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /Adicione exercícios/ })).toBeDisabled();
  });

  it('carregando fica desabilitado', () => {
    render(<StartTreinoButton exerciseCount={3} starting onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /Iniciando/ })).toBeDisabled();
  });

  it('chama onStart', async () => {
    const onStart = vi.fn();
    render(<StartTreinoButton exerciseCount={3} starting={false} onStart={onStart} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /Iniciar treino/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});

describe('useVisualViewport', () => {
  it('acompanha o encolhimento pelo teclado', () => {
    const listeners: Record<string, () => void> = {};
    const vv = {
      height: 800,
      offsetTop: 0,
      addEventListener: (type: string, cb: () => void) => (listeners[type] = cb),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('visualViewport', vv);
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });

    const { result, unmount } = renderHook(() => useVisualViewport(true));
    expect(result.current).toEqual({ height: 800, offsetTop: 0 });

    act(() => {
      vv.height = 450;
      vv.offsetTop = 120;
      listeners.resize();
    });
    expect(result.current).toEqual({ height: 450, offsetTop: 120 });

    unmount();
    expect(vv.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    vi.unstubAllGlobals();
  });
});
