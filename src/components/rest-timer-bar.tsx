import { motion } from 'motion/react';

import type { RestTimerTarget } from '@/hooks/use-rest-timer';
import { formatTime } from '@/lib/time-utils';

interface RestTimerBarProps {
  target: RestTimerTarget;
  remainingSeconds: number;
  presetSeconds: number;
  onAddSeconds: (delta: number) => void;
  onFinish: () => void;
}

/** Renderizar dentro de <Portal> + <AnimatePresence> (ver active-session). */
export function RestTimerBar({ target, remainingSeconds, presetSeconds, onAddSeconds, onFinish }: RestTimerBarProps) {
  const progress = presetSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / presetSeconds)) : 0;

  return (
    <motion.div
      role="timer"
      aria-live="off"
      aria-label={`Descanso de ${target.exerciseName}: ${formatTime(remainingSeconds)} restantes`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[var(--safe-bottom)] backdrop-blur-md">
      <div className="mx-auto h-[3px] max-w-lg overflow-hidden bg-surface-selected">
        <div
          className="h-full origin-left bg-primary transition-transform duration-300 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <div className="mx-auto flex max-w-lg items-center gap-2 px-[max(1rem,env(safe-area-inset-left))] py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold tracking-wide text-text-secondary">
            DESCANSO · {target.exerciseName.toUpperCase()}
          </p>
          <p className="font-display text-4xl leading-none font-bold tabular-nums">{formatTime(remainingSeconds)}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => onAddSeconds(-15)}
            aria-label="Diminuir 15 segundos"
            className="h-11 min-w-11 rounded-lg bg-surface-selected px-2.5 text-sm font-bold tabular-nums transition-transform active:scale-90">
            −15
          </button>
          <button
            type="button"
            onClick={() => onAddSeconds(15)}
            aria-label="Aumentar 15 segundos"
            className="h-11 min-w-11 rounded-lg bg-surface-selected px-2.5 text-sm font-bold tabular-nums transition-transform active:scale-90">
            +15
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="h-11 rounded-lg bg-primary px-3.5 text-sm font-bold text-white transition-transform active:scale-90">
            Pular
          </button>
        </div>
      </div>
    </motion.div>
  );
}
