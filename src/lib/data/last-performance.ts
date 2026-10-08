import { getState } from '@/lib/data/local-db';
import type { LastPerformance, SetType } from '@/types/models';

export function lastPerformanceDocId(uid: string, exerciseId: string, setType: SetType, setPosition: number) {
  return `${uid}_${exerciseId}_${setType}_${setPosition}`;
}

export async function getLastPerformance(
  uid: string,
  exerciseId: string,
  setType: SetType,
  setPosition: number
): Promise<LastPerformance | null> {
  return getState().lastPerformance[lastPerformanceDocId(uid, exerciseId, setType, setPosition)] ?? null;
}
