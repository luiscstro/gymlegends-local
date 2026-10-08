import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
}

export function Stepper({ value, onChange, min, max, label }: StepperProps) {
  return (
    <div className="inline-flex items-center rounded-xl bg-surface-selected" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Diminuir ${label.toLowerCase()}`}
        className="flex h-11 w-10 items-center justify-center rounded-l-xl transition-transform active:scale-75 disabled:opacity-30 disabled:active:scale-100">
        <Minus size={16} />
      </button>
      <span className="min-w-8 text-center font-display text-lg font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        className="flex h-11 w-10 items-center justify-center rounded-r-xl transition-transform active:scale-75 disabled:opacity-30 disabled:active:scale-100">
        <Plus size={16} />
      </button>
    </div>
  );
}
