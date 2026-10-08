import { CalendarDays, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { SkeletonList } from '@/components/skeleton';
import { StartTreinoButton } from '@/components/start-treino-button';
import { useStartTreino } from '@/hooks/use-start-treino';
import { estimateTreinoDurationMinutes, treinoMuscleGroupSummary, weekdaysAbbreviation } from '@/lib/treino-utils';
import { useRoutine } from '@/providers/routine-provider';
import type { Treino } from '@/types/models';

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export default function TodayPage() {
  const navigate = useNavigate();
  const { treinos, loading } = useRoutine();
  const { start, startingId, error } = useStartTreino();

  const now = new Date();
  const today = now.getDay();
  const todayTreinos = treinos.filter((t) => t.weekdays.includes(today));
  const otherTreinos = treinos.filter((t) => !t.weekdays.includes(today));

  return (
    <div className="animate-page-enter space-y-4 p-4">
      <div>
        <h1 className="font-display text-4xl leading-tight font-bold break-words">{WEEKDAY_NAMES[today]}</h1>
        <p className="text-text-secondary">
          {now.getDate()} de {MONTH_NAMES[now.getMonth()]}
        </p>
      </div>

      {error && (
        <p role="alert" className="animate-row-enter rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <SkeletonList count={2} />
      ) : treinos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma rotina ainda"
          description="Cadastre seus treinos na aba Rotina para ver o treino do dia aqui."
          action={
            <button
              type="button"
              onClick={() => navigate('/routine/new')}
              className="mt-1 h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-transform active:scale-[0.97]">
              Criar primeiro treino
            </button>
          }
        />
      ) : (
        <>
          {todayTreinos.length === 0 && (
            <p className="animate-row-enter rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-text-secondary">
              Nenhum treino marcado para hoje. Dia de descanso — ou escolha um abaixo.
            </p>
          )}

          {todayTreinos.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-text-secondary">TREINO DE HOJE</h2>
              {todayTreinos.map((treino, i) => (
                <TodayTreinoCard
                  key={treino.id}
                  treino={treino}
                  index={i}
                  starting={startingId === treino.id}
                  disabled={startingId !== null}
                  onStart={() => start(treino)}
                />
              ))}
            </section>
          )}

          {otherTreinos.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-text-secondary">OUTROS TREINOS</h2>
              {otherTreinos.map((treino, i) => (
                <OtherTreinoRow
                  key={treino.id}
                  treino={treino}
                  index={i}
                  starting={startingId === treino.id}
                  disabled={startingId !== null || treino.exercises.length === 0}
                  onPress={() => start(treino)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

interface CardProps {
  treino: Treino;
  index: number;
  starting: boolean;
  disabled: boolean;
}

function TodayTreinoCard({ treino, onStart, index, starting, disabled }: CardProps & { onStart: () => void }) {
  const minutes = estimateTreinoDurationMinutes(treino);
  const summary = treinoMuscleGroupSummary(treino);
  return (
    <article
      className="animate-row-enter space-y-2 rounded-2xl bg-surface p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 font-display text-2xl leading-tight font-semibold break-words">{treino.name}</h3>
        {minutes > 0 && (
          <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-surface-selected px-2 py-1 text-xs whitespace-nowrap text-text-secondary">
            <Clock size={12} />~{minutes} min
          </span>
        )}
      </div>
      {summary && <p className="text-sm break-words text-text-secondary">{summary}</p>}

      {treino.exercises.length > 0 && (
        <ul className="divide-y divide-border">
          {treino.exercises.map((exercise, i) => (
            <li key={`${exercise.exerciseId}-${i}`} className="flex items-baseline justify-between gap-3 py-2">
              <span className="min-w-0 truncate">{exercise.exerciseName}</span>
              <span className="shrink-0 text-sm whitespace-nowrap text-text-secondary tabular-nums">
                {exercise.targetSets} × {exercise.repRangeMin}–{exercise.repRangeMax}
              </span>
            </li>
          ))}
        </ul>
      )}

      <StartTreinoButton exerciseCount={treino.exercises.length} starting={starting} disabled={disabled} onStart={onStart} />
    </article>
  );
}

function OtherTreinoRow({ treino, onPress, index, starting, disabled }: CardProps & { onPress: () => void }) {
  const summary = treinoMuscleGroupSummary(treino);
  const days = treino.weekdays.length > 0 ? weekdaysAbbreviation(treino.weekdays) : 'Sem dia';
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={`Iniciar ${treino.name}`}
      style={{ animationDelay: `${index * 50}ms` }}
      className="animate-row-enter flex min-h-16 w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left transition-transform active:scale-[0.98] disabled:active:scale-100">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {treino.name}
          {summary && <span className="text-text-secondary"> · {summary}</span>}
        </p>
        <p className="truncate text-sm text-text-secondary">
          {days} · {treino.exercises.length} {treino.exercises.length === 1 ? 'exercício' : 'exercícios'}
        </p>
      </div>
      {starting ? (
        <Loader2 size={18} className="shrink-0 animate-spin text-primary" />
      ) : (
        <ChevronRight size={18} className="shrink-0 text-text-secondary" />
      )}
    </button>
  );
}
