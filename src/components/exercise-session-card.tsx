import { Check, Hourglass, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { SetTypeBadge } from '@/components/set-type-badge';
import { getLastPerformance } from '@/lib/data/last-performance';
import { deleteLoggedSet } from '@/lib/data/sessions';
import { formatWeight, parsePositiveNumber, sanitizeDecimal, sanitizeInt } from '@/lib/number-utils';
import { nextSetType, type LastPerformance, type LoggedSet, type PlannedExercise, type SetType } from '@/types/models';

interface DraftRow {
  key: string;
  setType: SetType;
  weight: string;
  reps: string;
  /** Preenchido assim que a confirmação é aceita - a partir daí a linha vira somente leitura, na hora. */
  confirmedSetId: string | null;
}

let draftKeySeq = 0;
function makeDraftRow(setType: SetType = 'work'): DraftRow {
  draftKeySeq += 1;
  return { key: `draft-${draftKeySeq}`, setType, weight: '', reps: '', confirmedSetId: null };
}

/** Mesmo template de colunas no cabeçalho e nas linhas: alinhamento garantido em qualquer largura. */
const ROW_GRID = 'grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_2.5rem] items-center gap-1.5';

interface ExerciseSessionCardProps {
  exercise: PlannedExercise;
  loggedSets: LoggedSet[];
  uid: string;
  sessionId: string;
  onLogSet: (setType: SetType, setPosition: number, weight: number, reps: number) => Promise<string>;
}

export function ExerciseSessionCard({ exercise, loggedSets, uid, sessionId, onLogSet }: ExerciseSessionCardProps) {
  const [rows, setRows] = useState<DraftRow[]>(() =>
    Array.from({ length: Math.max(0, exercise.targetSets - loggedSets.length) }, () => makeDraftRow())
  );
  const [confirming, setConfirming] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [previousByKey, setPreviousByKey] = useState<Record<string, LastPerformance | null>>({});
  const requestedKeys = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function positionFor(rowIndex: number, setType: SetType) {
    const syncedIds = new Set(loggedSets.map((s) => s.id));
    const confirmedSynced = loggedSets.filter((s) => s.setType === setType).length;
    const confirmedPendingSync = rows.filter(
      (r) => r.setType === setType && r.confirmedSetId && !syncedIds.has(r.confirmedSetId)
    ).length;
    const draftsBefore = rows.slice(0, rowIndex).filter((r) => r.setType === setType && !r.confirmedSetId).length;
    return confirmedSynced + confirmedPendingSync + draftsBefore + 1;
  }

  // Busca o "Anterior" uma única vez por (tipo, posição) — digitar peso/reps não dispara novas consultas.
  useEffect(() => {
    rows.forEach((row, index) => {
      if (row.confirmedSetId) return;
      const position = positionFor(index, row.setType);
      const cacheKey = `${row.setType}-${position}`;
      if (requestedKeys.current.has(cacheKey)) return;
      requestedKeys.current.add(cacheKey);
      getLastPerformance(uid, exercise.exerciseId, row.setType, position)
        .then((result) => {
          if (mounted.current) setPreviousByKey((prev) => ({ ...prev, [cacheKey]: result }));
        })
        .catch(() => {
          requestedKeys.current.delete(cacheKey);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, loggedSets, uid, exercise.exerciseId]);

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function cycleRowType(key: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, setType: nextSetType(r.setType) } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeDraftRow()]);
  }

  async function confirmRow(row: DraftRow, index: number) {
    const weightValue = parsePositiveNumber(row.weight);
    const repsValue = parsePositiveNumber(row.reps);
    if (weightValue === null || repsValue === null || confirming) return;
    setConfirming(row.key);
    setFailedKey(null);
    try {
      const position = positionFor(index, row.setType);
      const setId = await onLogSet(row.setType, position, weightValue, Math.round(repsValue));
      if (setId) updateRow(row.key, { confirmedSetId: setId });
      else setFailedKey(row.key);
    } catch {
      setFailedKey(row.key);
    } finally {
      setConfirming(null);
    }
  }

  function handleUndo(setId: string, localRowKey?: string) {
    if (!window.confirm('Remover essa série do treino?')) return;
    deleteLoggedSet(sessionId, setId)
      .then(() => {
        if (localRowKey && mounted.current) updateRow(localRowKey, { confirmedSetId: null, weight: '', reps: '' });
      })
      .catch(() => window.alert('Não foi possível remover a série. Verifique a conexão e tente de novo.'));
  }

  return (
    <div className="space-y-2 rounded-2xl bg-surface p-3 sm:p-4">
      <div className="px-1">
        <h3 className="line-clamp-2 font-display text-2xl leading-tight font-semibold break-words hyphens-auto">
          {exercise.exerciseName}
        </h3>
        <p className="text-sm text-text-secondary">
          Meta: {exercise.targetSets} {exercise.targetSets === 1 ? 'série' : 'séries'} de {exercise.repRangeMin}-
          {exercise.repRangeMax} reps
        </p>
      </div>

      <div className={`${ROW_GRID} pt-1 text-[11px] font-semibold tracking-wide text-text-secondary`} aria-hidden>
        <span className="text-center">SÉRIE</span>
        <span className="truncate text-center">ANTERIOR</span>
        <span className="text-center">KG</span>
        <span className="text-center">REPS</span>
        <span />
      </div>

      {/* Séries já confirmadas antes desta tela abrir (ex: depois de um reload) - ainda não têm linha local. */}
      {loggedSets
        .filter((set) => !rows.some((r) => r.confirmedSetId === set.id))
        .map((set) => (
          <ConfirmedRow
            key={set.id}
            setType={set.setType}
            weight={formatWeight(set.weight)}
            reps={String(set.reps)}
            onUndo={() => handleUndo(set.id)}
          />
        ))}

      {rows.map((row, index) => {
        if (row.confirmedSetId) {
          return (
            <ConfirmedRow
              key={row.key}
              setType={row.setType}
              weight={formatWeight(parsePositiveNumber(row.weight) ?? 0)}
              reps={row.reps}
              onUndo={() => handleUndo(row.confirmedSetId!, row.key)}
            />
          );
        }

        const position = positionFor(index, row.setType);
        const previous = previousByKey[`${row.setType}-${position}`];
        const isConfirming = confirming === row.key;
        const ready = parsePositiveNumber(row.weight) !== null && parsePositiveNumber(row.reps) !== null;
        const failed = failedKey === row.key;

        return (
          <div key={row.key} className="animate-row-enter border-t border-border pt-2">
            <div className={ROW_GRID}>
              <SetTypeBadge setType={row.setType} onClick={() => cycleRowType(row.key)} size={40} />
              <button
                type="button"
                disabled={!previous}
                onClick={() =>
                  previous && updateRow(row.key, { weight: formatWeight(previous.weight), reps: String(previous.reps) })
                }
                aria-label={previous ? 'Repetir valores da última vez' : 'Sem registro anterior'}
                className="truncate rounded-md py-2 text-center text-sm text-text-secondary tabular-nums enabled:active:bg-surface-selected">
                {previous ? `${formatWeight(previous.weight)}×${previous.reps}` : '—'}
              </button>
              <input
                value={row.weight}
                onChange={(e) => updateRow(row.key, { weight: sanitizeDecimal(e.target.value) })}
                placeholder="0"
                inputMode="decimal"
                enterKeyHint="next"
                aria-label={`Peso em kg, série ${index + 1}`}
                disabled={isConfirming}
                className="h-10 w-full min-w-0 scroll-mb-40 rounded-lg bg-background px-1 text-center font-bold tabular-nums placeholder:text-text-secondary/60 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <input
                value={row.reps}
                onChange={(e) => updateRow(row.key, { reps: sanitizeInt(e.target.value) })}
                onKeyDown={(e) => e.key === 'Enter' && confirmRow(row, index)}
                placeholder="0"
                inputMode="numeric"
                enterKeyHint="done"
                aria-label={`Repetições, série ${index + 1}`}
                disabled={isConfirming}
                className="h-10 w-full min-w-0 scroll-mb-40 rounded-lg bg-background px-1 text-center font-bold tabular-nums placeholder:text-text-secondary/60 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => confirmRow(row, index)}
                disabled={!ready || isConfirming}
                aria-label="Confirmar série"
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg transition-[transform,background-color] duration-150 active:scale-90 ${
                  ready ? 'bg-success text-white' : 'bg-surface-selected text-text-secondary'
                }`}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isConfirming ? 'hourglass' : 'check'}
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}
                    transition={{ duration: 0.15 }}
                    className="flex">
                    {isConfirming ? <Hourglass size={18} /> : <Check size={18} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
            {failed && (
              <p role="alert" className="animate-row-enter pt-1 text-center text-xs text-danger">
                Não salvou. Verifique a conexão e toque no ✓ de novo.
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-surface-selected text-sm font-semibold transition-transform active:scale-[0.97]">
        <Plus size={16} /> Adicionar série
      </button>
    </div>
  );
}

interface ConfirmedRowProps {
  setType: SetType;
  weight: string;
  reps: string;
  onUndo: () => void;
}

function ConfirmedRow({ setType, weight, reps, onUndo }: ConfirmedRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      className={`${ROW_GRID} border-t border-border pt-2`}>
      <SetTypeBadge setType={setType} size={40} />
      <span className="text-center text-sm text-text-secondary">—</span>
      <div className="flex h-10 min-w-0 items-center justify-center truncate rounded-lg bg-success/10 px-1 font-bold tabular-nums">
        {weight}
      </div>
      <div className="flex h-10 min-w-0 items-center justify-center truncate rounded-lg bg-success/10 px-1 font-bold tabular-nums">
        {reps}
      </div>
      <button
        type="button"
        onClick={onUndo}
        aria-label="Desfazer série"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-white transition-transform active:scale-90">
        <Check size={18} />
      </button>
    </motion.div>
  );
}
