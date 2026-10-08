import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Portal } from '@/components/portal';
import { SkeletonList } from '@/components/skeleton';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { getCachedExerciseCatalog, loadExerciseCatalog, rememberExercise } from '@/lib/exercise-catalog-store';
import { addCustomExercise } from '@/lib/data/exercise-catalog';
import { groupByMuscle, normalizeSearch } from '@/lib/search-utils';
import { useAuth } from '@/providers/auth-provider';
import type { ExerciseCatalogItem } from '@/types/models';

interface ExercisePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseCatalogItem) => void;
  /** Exercícios já presentes no treino — aparecem marcados. */
  selectedIds?: string[];
}

export function ExercisePickerModal({ open, onClose, onSelect, selectedIds = [] }: ExercisePickerModalProps) {
  const { user } = useAuth();
  const viewport = useVisualViewport(open);
  useBodyScrollLock(open);

  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>(() => getCachedExerciseCatalog() ?? []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(() => getCachedExerciseCatalog() === null);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [openedWhile, setOpenedWhile] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset ao abrir (sincronizado no render, sem efeito)
  if (open !== openedWhile) {
    setOpenedWhile(open);
    if (open) {
      // Com cache, a lista aparece na hora; a atualização roda em segundo plano
      const cached = getCachedExerciseCatalog();
      if (cached) setCatalog(cached);
      setLoading(cached === null);
      setLoadError(false);
      setSearch('');
      setCreateError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadExerciseCatalog()
      .then((items) => {
        if (cancelled) return;
        setCatalog(items);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Falha na atualização em segundo plano não esconde a lista que já está na tela
        if (getCachedExerciseCatalog() === null) setLoadError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Ao digitar, volta a lista pro topo pra ver os primeiros resultados
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [search]);

  const term = normalizeSearch(search);
  const filtered = useMemo(
    () => (term ? catalog.filter((e) => normalizeSearch(e.name).includes(term)) : catalog),
    [catalog, term]
  );
  const groups = useMemo(() => groupByMuscle(filtered), [filtered]);
  const hasExactMatch = term.length > 0 && catalog.some((e) => normalizeSearch(e.name) === term);
  const canCreate = search.trim().length >= 2 && !hasExactMatch;

  async function handleCreate() {
    if (!user || !canCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const name = search.trim();
      const id = await addCustomExercise(name, 'Personalizado', user.uid);
      const item = { id, name, muscleGroup: 'Personalizado', createdBy: user.uid };
      rememberExercise(item);
      setCatalog((prev) => [...prev, item]);
      onSelect(item);
    } catch {
      setCreateError('Não foi possível criar o exercício. Verifique a conexão e tente de novo.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="picker-backdrop"
            className="fixed inset-x-0 z-50 flex items-stretch justify-center bg-black/70 sm:items-center sm:p-6"
            style={{ top: viewport.offsetTop, height: viewport.height }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Escolher exercício"
              className="flex h-full w-full flex-col bg-background pt-[max(var(--safe-top),0.75rem)] sm:h-[min(80vh,680px)] sm:max-w-md sm:rounded-3xl sm:pt-3 sm:shadow-2xl sm:ring-1 sm:ring-border"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 16, filter: 'blur(2px)' }}
              transition={{ type: 'spring', duration: 0.42, bounce: 0 }}>
              <div className="space-y-3 border-b border-border px-4 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold">Escolher exercício</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary transition-transform active:scale-90">
                    <X size={22} />
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-surface px-3 ring-1 ring-transparent transition-shadow focus-within:ring-primary">
                  <Search size={18} className="shrink-0 text-text-secondary" />
                  <input
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar ou criar exercício"
                    aria-label="Buscar exercício"
                    className="min-w-0 flex-1 bg-transparent py-3 placeholder:text-text-secondary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Limpar busca"
                      className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(var(--safe-bottom),1rem)]">
                {canCreate && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 text-left text-primary transition-transform active:scale-[0.98] disabled:opacity-60">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-text-secondary">Criar exercício</span>
                      <span className="block truncate font-semibold">"{search.trim()}"</span>
                    </span>
                  </button>
                )}
                {createError && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {createError}
                  </p>
                )}

                {loading ? (
                  <div className="pt-3">
                    <SkeletonList count={6} variant="row" />
                  </div>
                ) : loadError ? (
                  <p className="py-10 text-center text-text-secondary">
                    Não foi possível carregar os exercícios. Feche e abra de novo.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="py-10 text-center text-text-secondary">
                    Nenhum exercício com esse nome. Use o botão acima para criá-lo.
                  </p>
                ) : (
                  groups.map((group) => (
                    <section key={group.muscleGroup} aria-label={group.muscleGroup}>
                      <h3 className="sticky top-0 z-10 bg-background pt-4 pb-1 text-xs font-semibold tracking-wide text-text-secondary">
                        {group.muscleGroup.toUpperCase()}
                      </h3>
                      <ul className="divide-y divide-border">
                        {group.items.map((item) => {
                          const alreadyIn = selectedIds.includes(item.id);
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => onSelect(item)}
                                className="flex min-h-12 w-full items-center gap-2 py-2.5 text-left transition-opacity active:opacity-60">
                                <span className="min-w-0 flex-1 break-words">{item.name}</span>
                                {alreadyIn && (
                                  <span className="flex shrink-0 items-center gap-1 text-xs text-success">
                                    <Check size={14} /> no treino
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
