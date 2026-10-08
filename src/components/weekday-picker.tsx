const DAYS = [
  { short: 'D', full: 'Domingo' },
  { short: 'S', full: 'Segunda' },
  { short: 'T', full: 'Terça' },
  { short: 'Q', full: 'Quarta' },
  { short: 'Q', full: 'Quinta' },
  { short: 'S', full: 'Sexta' },
  { short: 'S', full: 'Sábado' },
];

interface WeekdayPickerProps {
  value: number[];
  onChange: (next: number[]) => void;
}

export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));
  }

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="group" aria-label="Dias da semana">
      {DAYS.map(({ short, full }, day) => {
        const selected = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            aria-pressed={selected}
            aria-label={full}
            title={full}
            className={`mx-auto flex aspect-square w-full max-w-11 items-center justify-center rounded-full text-sm font-bold transition-colors duration-150 active:scale-90 ${
              selected ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
            }`}>
            {short}
          </button>
        );
      })}
    </div>
  );
}
