import { ChevronDown, ChevronUp, ClipboardX, Dumbbell, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { ExercisePickerModal } from '@/components/exercise-picker-modal';
import { SkeletonList } from '@/components/skeleton';
import { Stepper } from '@/components/stepper';
import { WeekdayPicker } from '@/components/weekday-picker';
import { loadExerciseCatalog } from '@/lib/exercise-catalog-store';
import { createTreino, deleteTreino, updateTreino } from '@/lib/data/routines';
import {
  LIMITS,
  makeFormExercise,
  moveItem,
  plannedFromCatalog,
  removeAt,
  toPlannedExercises,
  withRepMax,
  withRepMin,
  withSets,
  type FormExercise,
} from '@/lib/treino-form';
import { useRoutine } from '@/providers/routine-provider';
import type { ExerciseCatalogItem, PlannedExercise } from '@/types/models';

export default function EditTreinoPage() {
  const navigate = useNavigate();
  const { treinoId } = useParams<{ treinoId: string }>();
  const { routine, treinos, loading } = useRoutine();
  const isNew = !treinoId || treinoId === 'new';
  const existing = treinos.find((t) => t.id === treinoId);

  const [name, setName] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [items, setItems] = useState<FormExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loadedTreinoId, setLoadedTreinoId] = useState<string | null>(null);

  // Pré-carrega o catálogo: quando o usuário tocar em "Adicionar", a lista já está pronta
  useEffect(() => {
    loadExerciseCatalog().catch(() => {});
  }, []);

  if (existing && existing.id !== loadedTreinoId) {
    setLoadedTreinoId(existing.id);
    setName(existing.name);
    setWeekdays(existing.weekdays);
    setItems(existing.exercises.map(makeFormExercise));
    setDirty(false);
  }

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
    };
  }

  function updateItem(index: number, change: (exercise: PlannedExercise) => PlannedExercise) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, exercise: change(item.exercise) } : item)));
    setDirty(true);
  }

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => moveItem(prev, index, direction));
    setDirty(true);
  }

  function handleSelectExercise(catalogItem: ExerciseCatalogItem) {
    setItems((prev) => [...prev, makeFormExercise(plannedFromCatalog(catalogItem, prev.length))]);
    setDirty(true);
    setPickerOpen(false);
  }

  function handleClose() {
    if (dirty && !window.confirm('Sair sem salvar as alterações?')) return;
    navigate('/routine');
  }

  async function handleSave() {
    if (!routine || !name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    const exercises = toPlannedExercises(items);
    try {
      if (isNew) {
        const id = await createTreino(routine.id, name.trim(), treinos.length);
        await updateTreino(routine.id, id, { weekdays, exercises });
      } else if (treinoId) {
        await updateTreino(routine.id, treinoId, { name: name.trim(), weekdays, exercises });
      }
      setDirty(false);
      navigate('/routine');
    } catch {
      setSaveError('Não foi possível salvar. Verifique a conexão e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!routine || !treinoId || isNew) return;
    if (window.confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) {
      deleteTreino(routine.id, treinoId).then(() => navigate('/routine'));
    }
  }

  if (!isNew && !existing) {
    return (
      <div className="p-4">
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <EmptyState
            icon={ClipboardX}
            title="Treino não encontrado"
            description="Ele pode ter sido excluído."
            action={
              <button
                type="button"
                onClick={() => navigate('/routine')}
                className="mt-1 h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white">
                Voltar para Rotina
              </button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-page-enter space-y-6 px-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-4xl leading-tight font-bold">{isNew ? 'Novo treino' : 'Editar treino'}</h1>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface transition-transform active:scale-90">
          <X size={18} />
        </button>
      </div>

      <section className="space-y-2">
        <label htmlFor="treino-name" className="block text-sm font-semibold text-text-secondary">
          NOME DO TREINO
        </label>
        <input
          id="treino-name"
          value={name}
          onChange={(e) => edit(setName)(e.target.value)}
          maxLength={60}
          enterKeyHint="done"
          placeholder="ex: Treino A — Peito e Tríceps"
          className="w-full min-w-0 rounded-xl bg-surface px-3 py-3 ring-1 ring-transparent transition-shadow placeholder:text-text-secondary focus:ring-primary focus:outline-none"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary">DIAS DA SEMANA</h2>
        <WeekdayPicker value={weekdays} onChange={edit(setWeekdays)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">
            EXERCÍCIOS {items.length > 0 && <span className="tabular-nums">({items.length})</span>}
          </h2>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-9 items-center gap-1 rounded-full border border-primary px-3 text-sm font-semibold text-primary transition-transform active:scale-[0.96]">
            <Plus size={16} /> Adicionar
          </button>
        </div>

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-text-secondary transition-colors active:bg-surface">
            <Dumbbell size={24} />
            <span className="text-sm">Nenhum exercício ainda. Toque para adicionar.</span>
          </button>
        ) : (
          items.map(({ key, exercise }, index) => (
            <div key={key} className="animate-row-enter space-y-3 rounded-2xl bg-surface p-3">
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 pt-2 leading-snug font-medium break-words hyphens-auto">{exercise.exerciseName}</p>
                <div className="flex shrink-0 gap-1">
                  <IconButton label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ChevronUp size={18} />
                  </IconButton>
                  <IconButton label="Mover para baixo" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                    <ChevronDown size={18} />
                  </IconButton>
                  <IconButton
                    label="Remover exercício"
                    danger
                    onClick={() => {
                      setItems((p) => removeAt(p, index));
                      setDirty(true);
                    }}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-text-secondary">Séries</span>
                  <Stepper
                    label="Séries"
                    value={exercise.targetSets}
                    min={LIMITS.sets.min}
                    max={LIMITS.sets.max}
                    onChange={(v) => updateItem(index, (e) => withSets(e, v))}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-text-secondary">Repetições</span>
                  <div className="flex items-center gap-1.5">
                    <Stepper
                      label="Repetições mínimas"
                      value={exercise.repRangeMin}
                      min={LIMITS.reps.min}
                      max={LIMITS.reps.max}
                      onChange={(v) => updateItem(index, (e) => withRepMin(e, v))}
                    />
                    <span className="text-text-secondary" aria-hidden>
                      –
                    </span>
                    <Stepper
                      label="Repetições máximas"
                      value={exercise.repRangeMax}
                      min={exercise.repRangeMin}
                      max={LIMITS.reps.max}
                      onChange={(v) => updateItem(index, (e) => withRepMax(e, v))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {!isNew && (
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-danger transition-colors active:bg-danger/10">
          <Trash2 size={16} /> Excluir treino
        </button>
      )}

      {/* Barra de salvar fixa acima da navegação — não precisa rolar até o fim com muitos exercícios */}
      <div className="sticky bottom-[calc(var(--nav-height)+var(--safe-bottom))] -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-3">
        {saveError && (
          <p role="alert" className="animate-row-enter pb-2 text-center text-sm text-danger">
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-[0_8px_24px_-10px_rgba(60,135,247,0.6)] transition-transform active:scale-[0.97] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100">
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? 'Salvando...' : name.trim() ? 'Salvar treino' : 'Dê um nome ao treino'}
        </button>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectExercise}
        selectedIds={items.map((i) => i.exercise.exerciseId)}
      />
    </div>
  );
}

function IconButton({
  onClick,
  children,
  label,
  danger,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-surface-selected transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100 ${
        danger ? 'text-danger' : ''
      }`}>
      {children}
    </button>
  );
}
