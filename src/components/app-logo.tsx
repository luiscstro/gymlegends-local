import { Dumbbell } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-[0_8px_24px_-8px_rgba(60,135,247,0.45)]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/15 to-transparent" />
        <Dumbbell size={28} color="#3C87F7" className="relative" />
      </div>
      <h1 className="font-display text-4xl font-bold leading-none">
        Gym<span className="text-primary">Legends</span>
      </h1>
    </div>
  );
}
