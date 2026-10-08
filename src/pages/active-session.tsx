import { AnimatePresence } from 'motion/react';
import { Dumbbell, Loader2, Timer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { ExerciseSessionCard } from '@/components/exercise-session-card';
import { Portal } from '@/components/portal';
import { RestTimerBar } from '@/components/rest-timer-bar';
import { SkeletonList } from '@/components/skeleton';
import { useRestTimer } from '@/hooks/use-rest-timer';
import { finishSession, logSet, subscribeToLoggedSets } from '@/lib/data/sessions';
import { useAuth } from '@/providers/auth-provider';
import { useRoutine } from '@/providers/routine-provider';
import { formatElapsed } from '@/lib/time-utils';
import type { LoggedSet, SetType } from '@/types/models';

const DEFAULT_REST_SECONDS = 90;

export default function ActiveSessionPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const treinoId = searchParams.get('treinoId');
  const { user } = useAuth();
  const { treinos, loading: routineLoading } = useRoutine();
  const treino = treinos.find((t) => t.id === treinoId);

  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const { target, presetSeconds, remainingSeconds, start, finish, addSeconds, requestPermission } = useRestTimer();

  useEffect(() => {
    if (!sessionId || !user) return;
    return subscribeToLoggedSets(sessionId, user.uid, setLoggedSets);
  }, [sessionId, user]);

  useEffect(() => {
    requestPermission().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const loggedByExercise = useMemo(() => {
    const map = new Map<string, LoggedSet[]>();
    for (const set of loggedSets) {
      const list = map.get(set.exerciseId) ?? [];
      list.push(set);
      map.set(set.exerciseId, list);
    }
    return map;
  }, [loggedSets]);

  async function handleLogSet(
    exerciseId: string,
    exerciseName: string,
    setType: SetType,
    setPosition: number,
    weight: number,
    reps: number
  ) {
    if (!user || !sessionId) return '';
    const setId = await logSet({ uid: user.uid, sessionId, exerciseId, exerciseName, setType, setPosition, weight, reps });
    start({ uid: user.uid, sessionId, setId, exerciseId, exerciseName, setType, setPosition }, DEFAULT_REST_SECONDS).catch(() => {});
    return setId;
  }

  async function handleFinish() {
    if (!sessionId) return;
    if (!window.confirm('Quer encerrar esse treino agora?')) return;
    setFinishing(true);
    try {
      await finishSession(sessionId, loggedByExercise.size);
      navigate('/today');
    } finally {
      setFinishing(false);
    }
  }

  if (!treino) {
    return (
      <div className="mx-auto max-w-lg p-4">
        {routineLoading ? (
          <SkeletonList />
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="Treino não encontrado"
            description="Ele pode ter sido excluído. Volte e inicie outro treino."
            action={
              <button
                type="button"
                onClick={() => navigate('/today')}
                className="mt-1 h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-transform active:scale-[0.97]">
                Voltar para Hoje
              </button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-page-enter min-h-dvh bg-background pb-[calc(9rem+var(--safe-bottom))]">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left))] py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-semibold">{treino.name}</h1>
            <p className="flex items-center gap-1 text-sm font-bold text-primary tabular-nums">
              <Timer size={14} aria-hidden /> {formatElapsed(elapsed)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-transform active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100">
            {finishing && <Loader2 size={16} className="animate-spin" />}
            {finishing ? 'Salvando...' : 'Finalizar'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-[max(1rem,env(safe-area-inset-left))] py-4">
        {treino.exercises.map((exercise, index) => (
          <div key={exercise.exerciseId} className="animate-row-enter" style={{ animationDelay: `${index * 60}ms` }}>
            <ExerciseSessionCard
              exercise={exercise}
              loggedSets={loggedByExercise.get(exercise.exerciseId) ?? []}
              uid={user!.uid}
              sessionId={sessionId!}
              onLogSet={(setType, setPosition, weight, reps) =>
                handleLogSet(exercise.exerciseId, exercise.exerciseName, setType, setPosition, weight, reps)
              }
            />
          </div>
        ))}
      </div>

      <Portal>
        <AnimatePresence>
          {target && (
            <RestTimerBar
              key="rest-timer"
              target={target}
              remainingSeconds={remainingSeconds}
              presetSeconds={presetSeconds}
              onAddSeconds={addSeconds}
              onFinish={finish}
            />
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
