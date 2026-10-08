import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { SkeletonList } from '@/components/skeleton';
import { StartTreinoButton } from '@/components/start-treino-button';
import { useStartTreino } from '@/hooks/use-start-treino';
import { deleteTreino } from '@/lib/data/routines';
import { weekdaysAbbreviation } from '@/lib/treino-utils';
import { useRoutine } from '@/providers/routine-provider';
import type { Treino } from '@/types/models';

export default function RoutinePage() {
  const navigate = useNavigate();
  const { routine, treinos, loading } = useRoutine();
  const { start, startingId, error } = useStartTreino();

  function handleDelete(treino: Treino) {
    if (!routine) return;
    if (window.confirm(`Excluir "${treino.name}"? Essa ação não pode ser desfeita.`)) {
      deleteTreino(routine.id, treino.id);
    }
  }

  return (
    <div className="animate-page-enter space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Rotina</h1>
        <button
          type="button"
          onClick={() => navigate('/routine/new')}
          className="flex h-10 items-center gap-1 rounded-full border border-primary px-3.5 text-sm font-semibold text-primary transition-transform active:scale-[0.96]">
          <Plus size={16} /> Novo treino
        </button>
      </div>

      {error && (
        <p role="alert" className="animate-row-enter rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : treinos.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum treino cadastrado"
          description="Monte sua divisão: Treino A, B, C… com os exercícios e os dias da semana."
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
        <div className="space-y-3">
          {treinos.map((treino, index) => (
            <article
              key={treino.id}
              style={{ animationDelay: `${index * 60}ms` }}
              className="animate-row-enter space-y-3 rounded-2xl bg-surface p-4">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/routine/${treino.id}`)}
                  className="min-w-0 flex-1 text-left">
                  <h3 className="truncate font-display text-2xl leading-tight font-semibold">{treino.name}</h3>
                  <span className="mt-1 inline-block max-w-full truncate rounded-full bg-surface-selected px-2 py-0.5 text-xs text-text-secondary">
                    {treino.weekdays.length > 0 ? weekdaysAbbreviation(treino.weekdays) : 'Sem dia definido'}
                  </span>
                </button>
                <div className="-mt-1 -mr-2 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/routine/${treino.id}`)}
                    aria-label={`Editar ${treino.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors active:bg-surface-selected">
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(treino)}
                    aria-label={`Excluir ${treino.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors active:bg-danger/10 active:text-danger">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <p className="line-clamp-2 text-sm break-words text-text-secondary">
                {treino.exercises.length > 0
                  ? treino.exercises.map((e) => e.exerciseName).join(' · ')
                  : 'Nenhum exercício adicionado ainda'}
              </p>
              <StartTreinoButton
                exerciseCount={treino.exercises.length}
                starting={startingId === treino.id}
                disabled={startingId !== null}
                onStart={() => start(treino)}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
