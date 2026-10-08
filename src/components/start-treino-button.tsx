import { Loader2, Play } from 'lucide-react';

interface StartTreinoButtonProps {
  exerciseCount: number;
  starting: boolean;
  disabled?: boolean;
  onStart: () => void;
}

export function StartTreinoButton({ exerciseCount, starting, disabled, onStart }: StartTreinoButtonProps) {
  const empty = exerciseCount === 0;
  return (
    <button
      type="button"
      onClick={onStart}
      disabled={empty || starting || disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100">
      {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={14} fill="currentColor" className="translate-x-px" />}
      {starting ? 'Iniciando...' : empty ? 'Adicione exercícios para iniciar' : 'Iniciar treino'}
    </button>
  );
}
