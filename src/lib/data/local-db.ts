import type {
  ExerciseCatalogItem,
  LastPerformance,
  LoggedSet,
  Routine,
  Treino,
  WorkoutSession,
} from '@/types/models';

/**
 * Banco de dados local: tudo fica no localStorage deste navegador, num único JSON.
 * Nada sai do aparelho. Para trocar de celular ou se proteger de limpeza de dados, use o backup (Dados → Exportar).
 */

export const STORAGE_KEY = 'gymlegends-local:v1';
export const BACKUP_APP_ID = 'gymlegends-local';
const SCHEMA_VERSION = 1;

/** Usuário único do modo local — mantém a mesma forma de dados da versão com login. */
export const LOCAL_UID = 'local';

export interface StoredTreino extends Treino {
  routineId: string;
}

export interface StoredLoggedSet extends LoggedSet {
  sessionId: string;
}

export interface DbState {
  version: number;
  routines: Routine[];
  treinos: StoredTreino[];
  sessions: WorkoutSession[];
  loggedSets: StoredLoggedSet[];
  lastPerformance: Record<string, LastPerformance>;
  exerciseCatalog: ExerciseCatalogItem[];
}

export class StorageFullError extends Error {
  constructor() {
    super('O armazenamento do navegador está cheio. Exporte um backup e apague sessões antigas.');
    this.name = 'StorageFullError';
  }
}

export function emptyState(): DbState {
  return {
    version: SCHEMA_VERSION,
    routines: [],
    treinos: [],
    sessions: [],
    loggedSets: [],
    lastPerformance: {},
    exerciseCatalog: [],
  };
}

type Listener = (state: DbState) => void;

let state: DbState | null = null;
const listeners = new Set<Listener>();

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

/** Garante todas as coleções, mesmo vindo de um JSON antigo ou incompleto. */
function normalize(value: unknown): DbState {
  const base = emptyState();
  if (!value || typeof value !== 'object') return base;
  const v = value as Partial<DbState>;
  return {
    version: SCHEMA_VERSION,
    routines: Array.isArray(v.routines) ? v.routines : base.routines,
    treinos: Array.isArray(v.treinos) ? v.treinos : base.treinos,
    sessions: Array.isArray(v.sessions) ? v.sessions : base.sessions,
    loggedSets: Array.isArray(v.loggedSets) ? v.loggedSets : base.loggedSets,
    lastPerformance:
      v.lastPerformance && typeof v.lastPerformance === 'object' ? v.lastPerformance : base.lastPerformance,
    exerciseCatalog: Array.isArray(v.exerciseCatalog) ? v.exerciseCatalog : base.exerciseCatalog,
  };
}

export function getState(): DbState {
  if (!state) state = load();
  return state;
}

function emit() {
  const current = getState();
  listeners.forEach((listener) => listener(current));
}

/** Aplica uma alteração imutável, salva e avisa quem estiver ouvindo. Falha sem alterar nada se o armazenamento estiver cheio. */
export function update(mutator: (current: DbState) => DbState): DbState {
  const next = mutator(getState());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    if (error instanceof DOMException && /quota/i.test(error.name + error.message)) throw new StorageFullError();
    throw error;
  }
  state = next;
  emit();
  return next;
}

/** Ouve mudanças (inclusive de outra aba aberta). O callback é chamado na hora com o estado atual. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(getState());
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    emit();
  });
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Backup ----------

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: DbState;
}

export function exportBackup(now: Date = new Date()): string {
  const backup: BackupFile = { app: BACKUP_APP_ID, version: SCHEMA_VERSION, exportedAt: now.toISOString(), data: getState() };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(now: Date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `gymlegends-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export class InvalidBackupError extends Error {
  constructor() {
    super('Esse arquivo não é um backup do GymLegends.');
    this.name = 'InvalidBackupError';
  }
}

/** Substitui todos os dados pelos do backup. Lança InvalidBackupError se o arquivo não for reconhecido. */
export function importBackup(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBackupError();
  }
  const backup = parsed as Partial<BackupFile>;
  if (!backup || backup.app !== BACKUP_APP_ID || !backup.data || typeof backup.data !== 'object') {
    throw new InvalidBackupError();
  }
  const data = normalize(backup.data);
  update(() => data);
  return data;
}

export function clearAllData() {
  update(() => emptyState());
}

export function backupSummary(current: DbState = getState()) {
  return {
    treinos: current.treinos.length,
    sessions: current.sessions.filter((s) => s.status === 'completed').length,
    sets: current.loggedSets.length,
    bytes: new Blob([JSON.stringify(current)]).size,
  };
}

/** Pede ao navegador para não apagar os dados sozinho (Chrome/Android respeitam; Safari decide por conta própria). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** Só para testes. */
export function resetLocalDbForTests() {
  state = null;
  listeners.clear();
}
