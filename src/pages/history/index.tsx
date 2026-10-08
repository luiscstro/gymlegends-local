import { ChevronRight, Dumbbell, History as HistoryIcon, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { SkeletonList } from '@/components/skeleton';
import { dayMonthAbbr, durationMinutes, monthGroupLabel, monthKey } from '@/lib/date-utils';
import { listLoggedExercises, subscribeToCompletedSessions, type ExerciseSummary } from '@/lib/data/history';
import { useAuth } from '@/providers/auth-provider';
import type { WorkoutSession } from '@/types/models';

type Tab = 'sessions' | 'exercises';
const TABS: { key: Tab; label: string }[] = [
  { key: 'sessions', label: 'Sessões' },
  { key: 'exercises', label: 'Exercícios' },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exercisesError, setExercisesError] = useState(false);
  const [loadedExercisesForTab, setLoadedExercisesForTab] = useState(false);

  if (tab === 'exercises' && !loadedExercisesForTab) {
    setLoadedExercisesForTab(true);
    setLoadingExercises(true);
    setExercisesError(false);
  }

  useEffect(() => {
    if (!user) return;
    return subscribeToCompletedSessions(user.uid, (result) => {
      setSessions(result);
      setLoadingSessions(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user || tab !== 'exercises') return;
    let cancelled = false;
    listLoggedExercises(user.uid)
      .then((result) => {
        if (!cancelled) setExercises(result);
      })
      .catch(() => {
        if (!cancelled) setExercisesError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingExercises(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tab]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; title: string; sessions: WorkoutSession[] }>();
    for (const session of sessions) {
      const key = monthKey(session.startedAt);
      if (!map.has(key)) map.set(key, { key, title: monthGroupLabel(session.startedAt), sessions: [] });
      map.get(key)!.sessions.push(session);
    }
    return Array.from(map.values());
  }, [sessions]);

  return (
    <div className="animate-page-enter space-y-4 p-4">
      <h1 className="font-display text-4xl font-bold">Histórico</h1>

      <div role="tablist" aria-label="Visualização do histórico" className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`h-10 min-w-0 truncate rounded-lg px-2 text-sm font-semibold transition-colors duration-150 ${
              tab === t.key ? 'bg-surface-selected text-text' : 'text-text-secondary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions' ? (
        loadingSessions ? (
          <SkeletonList count={3} variant="row" />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="Nenhuma sessão ainda"
            description="Finalize um treino para ver o histórico aqui."
          />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.key} className="space-y-2">
                <h2 className="text-sm font-semibold text-text-secondary">{group.title}</h2>
                {group.sessions.map((session, i) => (
                  <SessionRow key={session.id} session={session} index={i} />
                ))}
              </section>
            ))}
          </div>
        )
      ) : loadingExercises ? (
        <SkeletonList count={4} variant="row" />
      ) : exercisesError ? (
        <EmptyState
          icon={WifiOff}
          title="Não foi possível carregar"
          description="Verifique a conexão e abra a aba de novo."
        />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Nenhum exercício registrado"
          description="Os exercícios aparecem aqui assim que você registra a primeira série."
        />
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise, i) => (
            <ExerciseRow key={exercise.exerciseId} exercise={exercise} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session, index }: { session: WorkoutSession; index: number }) {
  const { day, month } = dayMonthAbbr(session.startedAt);
  const minutes = durationMinutes(session.startedAt, session.completedAt);
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="animate-row-enter flex items-center gap-3 rounded-2xl bg-surface p-4">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-selected">
        <span className="font-display text-lg leading-tight font-bold tabular-nums">{day}</span>
        <span className="text-xs text-text-secondary">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{session.treinoNameSnapshot}</p>
        <p className="truncate text-sm text-text-secondary">
          {minutes < 1 ? '<1' : minutes} min · {session.exerciseCount} {session.exerciseCount === 1 ? 'exercício' : 'exercícios'}
        </p>
      </div>
    </div>
  );
}

function ExerciseRow({ exercise, index }: { exercise: ExerciseSummary; index: number }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/history/exercise/${exercise.exerciseId}?name=${encodeURIComponent(exercise.exerciseName)}`)}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="animate-row-enter flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left transition-transform active:scale-[0.98]">
      <span className="min-w-0 flex-1 truncate">{exercise.exerciseName}</span>
      <ChevronRight size={18} className="shrink-0 text-text-secondary" />
    </button>
  );
}
