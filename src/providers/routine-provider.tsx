import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getOrCreateActiveRoutine, subscribeToTreinos } from '@/lib/data/routines';
import { useAuth } from '@/providers/auth-provider';
import type { Routine, Treino } from '@/types/models';

interface RoutineContextValue {
  routine: Routine | null;
  treinos: Treino[];
  loading: boolean;
}

const RoutineContext = createContext<RoutineContextValue>({ routine: null, treinos: [], loading: true });

export function RoutineProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedForUid, setLoadedForUid] = useState<string | null>(null);

  // Reinicia o estado local ao mudar de usuário (sincronizado durante o render, não num efeito).
  if (uid !== loadedForUid) {
    setLoadedForUid(uid);
    setRoutine(null);
    setTreinos([]);
    setLoading(uid != null);
  }

  useEffect(() => {
    if (!uid) return;
    let unsubscribe: (() => void) | undefined;

    getOrCreateActiveRoutine(uid).then((activeRoutine) => {
      setRoutine(activeRoutine);
      unsubscribe = subscribeToTreinos(activeRoutine.id, (nextTreinos) => {
        setTreinos(nextTreinos);
        setLoading(false);
      });
    });

    return () => unsubscribe?.();
  }, [uid]);

  return <RoutineContext.Provider value={{ routine, treinos, loading }}>{children}</RoutineContext.Provider>;
}

export function useRoutine() {
  return useContext(RoutineContext);
}
