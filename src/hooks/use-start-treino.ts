import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { startSession } from '@/lib/data/sessions';
import { useAuth } from '@/providers/auth-provider';
import { useRoutine } from '@/providers/routine-provider';
import type { Treino } from '@/types/models';

/** Inicia uma sessão com trava contra toque duplo (que criaria duas sessões no banco). */
export function useStartTreino() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { routine } = useRoutine();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function start(treino: Treino) {
    if (!user || !routine || inFlight.current || treino.exercises.length === 0) return;
    inFlight.current = true;
    setStartingId(treino.id);
    setError(null);
    try {
      const sessionId = await startSession(user.uid, routine.id, treino.id, treino.name);
      navigate(`/session/${sessionId}?treinoId=${treino.id}`);
    } catch {
      setError('Não foi possível iniciar o treino. Verifique a conexão.');
      inFlight.current = false;
      setStartingId(null);
    }
  }

  return { start, startingId, error };
}
