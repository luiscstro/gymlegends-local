export type SetType = 'warmup' | 'feeder' | 'work' | 'top' | 'cluster';

export const SET_TYPES: SetType[] = ['warmup', 'feeder', 'work', 'top', 'cluster'];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Aquecimento',
  feeder: 'Feeder Set',
  work: 'Work Set',
  top: 'Top Set',
  cluster: 'Cluster Set',
};

/** Letra única exibida dentro do badge compacto da tabela de séries. */
export const SET_TYPE_SHORT: Record<SetType, string> = {
  warmup: 'A',
  feeder: 'F',
  work: 'W',
  top: 'T',
  cluster: 'C',
};

export const SET_TYPE_ORDER: SetType[] = ['warmup', 'feeder', 'work', 'top', 'cluster'];

export function nextSetType(current: SetType): SetType {
  const index = SET_TYPE_ORDER.indexOf(current);
  return SET_TYPE_ORDER[(index + 1) % SET_TYPE_ORDER.length];
}

export const SET_TYPE_COLORS: Record<SetType, string> = {
  warmup: '#D9A441',
  feeder: '#2A9D8F',
  work: '#4B4B50',
  top: '#D64545',
  cluster: '#8B6FD1',
};

/** Cor do texto sobre o badge preenchido - a maioria usa branco, exceto o amarelo do aquecimento. */
export const SET_TYPE_TEXT_COLORS: Record<SetType, string> = {
  warmup: '#20160A',
  feeder: '#ffffff',
  work: '#ffffff',
  top: '#ffffff',
  cluster: '#ffffff',
};

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  weightUnit: 'kg' | 'lb';
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  muscleGroup: string;
  createdBy: 'system' | string;
}

export interface PlannedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  order: number;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  notes?: string;
}

export interface Treino {
  id: string;
  name: string;
  order: number;
  weekdays: number[];
  exercises: PlannedExercise[];
}

export interface Routine {
  id: string;
  ownerUid: string;
  name: string;
  isActive: boolean;
}

export type SessionStatus = 'in_progress' | 'completed';

export interface WorkoutSession {
  id: string;
  ownerUid: string;
  routineId: string;
  treinoId: string;
  treinoNameSnapshot: string;
  status: SessionStatus;
  startedAt: number;
  completedAt: number | null;
  exerciseCount: number;
}

export interface LoggedSet {
  id: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  setType: SetType;
  setPosition: number;
  weight: number;
  reps: number;
  restTakenSeconds: number | null;
  loggedAt: number;
}

export interface LastPerformance {
  exerciseId: string;
  setType: SetType;
  setPosition: number;
  weight: number;
  reps: number;
  restTakenSeconds: number | null;
  sessionId: string;
  loggedAt: number;
}
