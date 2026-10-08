import { useEffect, useRef, useState } from 'react';

import { recordRestTaken } from '@/lib/data/sessions';
import type { SetType } from '@/types/models';

export interface RestTimerTarget {
  uid: string;
  sessionId: string;
  setId: string;
  exerciseId: string;
  exerciseName: string;
  setType: SetType;
  setPosition: number;
}

export function useRestTimer() {
  const [target, setTarget] = useState<RestTimerTarget | null>(null);
  const [presetSeconds, setPresetSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const notificationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const endsAt = useRef(0);

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (navigator.vibrate) navigator.vibrate(200);
        void finish();
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  /** Pede a permissão de notificação adiantado (ex: ao abrir a sessão), pra não travar o fluxo de confirmar série. */
  async function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  async function start(newTarget: RestTimerTarget, seconds: number) {
    startedAt.current = Date.now();
    endsAt.current = Date.now() + seconds * 1000;
    setPresetSeconds(seconds);
    setRemainingSeconds(seconds);
    setTarget(newTarget);

    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationTimeout.current = setTimeout(() => {
        try {
          new Notification('Descanso finalizado', {
            body: `Hora da próxima série de ${newTarget.exerciseName} 💪`,
          });
        } catch {
          // alguns navegadores bloqueiam notificação sem interação do usuário - não é crítico
        }
      }, seconds * 1000);
    }
  }

  function addSeconds(delta: number) {
    endsAt.current += delta * 1000;
    setPresetSeconds((p) => Math.max(1, p + delta));
    setRemainingSeconds((r) => Math.max(0, r + delta));
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
      const remainingMs = Math.max(0, endsAt.current - Date.now());
      if (target && 'Notification' in window && Notification.permission === 'granted') {
        notificationTimeout.current = setTimeout(() => {
          try {
            new Notification('Descanso finalizado', { body: `Hora da próxima série de ${target.exerciseName} 💪` });
          } catch {
            // ignora
          }
        }, remainingMs);
      }
    }
  }

  async function finish() {
    if (!target) return;
    const finishedTarget = target;
    const actualSeconds = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));

    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
      notificationTimeout.current = null;
    }

    setTarget(null);
    setRemainingSeconds(0);

    await recordRestTaken({
      uid: finishedTarget.uid,
      sessionId: finishedTarget.sessionId,
      setId: finishedTarget.setId,
      exerciseId: finishedTarget.exerciseId,
      setType: finishedTarget.setType,
      setPosition: finishedTarget.setPosition,
      restTakenSeconds: actualSeconds,
    });
  }

  return { target, presetSeconds, remainingSeconds, start, finish, addSeconds, requestPermission };
}
