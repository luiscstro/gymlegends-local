import { AlertTriangle, CheckCircle2, Download, HardDrive, Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import {
  backupFileName,
  backupSummary,
  clearAllData,
  exportBackup,
  importBackup,
  InvalidBackupError,
  subscribe,
  type DbState,
} from '@/lib/data/local-db';

const LAST_BACKUP_KEY = 'gymlegends-local:last-backup';

function readLastBackup(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_BACKUP_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Recarrega para que rotina, catálogo e caches em memória leiam os dados novos do zero. */
function reloadApp() {
  window.location.assign(import.meta.env.BASE_URL);
}

export default function DataPage() {
  const [db, setDb] = useState<DbState | null>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(readLastBackup);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => subscribe(setDb), []);

  const summary = db ? backupSummary(db) : null;

  function handleExport() {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const now = Date.now();
    try {
      localStorage.setItem(LAST_BACKUP_KEY, String(now));
    } catch {
      // sem espaço para a data do backup: o arquivo já foi gerado, segue sem lembrar a data
    }
    setLastBackup(now);
    setMessage({ kind: 'ok', text: 'Backup gerado. Guarde o arquivo em um lugar seguro (Arquivos, Drive, e-mail).' });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('Importar este backup vai substituir todos os dados atuais deste aparelho. Continuar?')) return;

    setImporting(true);
    setMessage(null);
    try {
      importBackup(await file.text());
      reloadApp();
    } catch (error) {
      setImporting(false);
      setMessage({
        kind: 'error',
        text:
          error instanceof InvalidBackupError
            ? 'Esse arquivo não é um backup do GymLegends. Escolha o .json gerado em "Exportar backup".'
            : error instanceof Error
              ? error.message
              : 'Não foi possível importar o backup.',
      });
    }
  }

  function handleClear() {
    if (!window.confirm('Apagar TODOS os treinos, sessões e registros deste aparelho? Isso não pode ser desfeito.')) return;
    if (!window.confirm('Tem certeza? Exporte um backup antes se quiser guardar alguma coisa.')) return;
    clearAllData();
    try {
      localStorage.removeItem(LAST_BACKUP_KEY);
    } catch {
      // ignore
    }
    reloadApp();
  }

  return (
    <div className="animate-page-enter space-y-4 p-4">
      <h1 className="font-display text-4xl font-bold">Dados</h1>

      <section className="animate-row-enter space-y-3 rounded-2xl bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <HardDrive size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Salvo só neste aparelho</h2>
            <p className="text-sm text-text-secondary">
              Seus dados ficam no navegador, sem conta e sem servidor. Se você limpar os dados do navegador ou trocar de
              celular, eles se perdem. Por isso, faça backup.
            </p>
          </div>
        </div>
        {summary && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Treinos" value={summary.treinos} />
            <Stat label="Sessões" value={summary.sessions} />
            <Stat label="Séries" value={summary.sets} />
          </div>
        )}
        {summary && <p className="text-xs text-text-secondary">Espaço usado: {formatBytes(summary.bytes)}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary">BACKUP</h2>
        <p className="text-sm text-text-secondary">
          {lastBackup
            ? `Último backup: ${new Date(lastBackup).toLocaleDateString('pt-BR')}`
            : 'Você ainda não fez nenhum backup neste aparelho.'}
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white transition-transform active:scale-[0.97]">
          <Download size={18} /> Exportar backup
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={importing}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-selected font-semibold transition-transform active:scale-[0.97] disabled:opacity-60">
          {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {importing ? 'Importando...' : 'Importar backup'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-label="Arquivo de backup"
          data-testid="backup-input"
        />
      </section>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`animate-row-enter flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
            message.kind === 'error' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
          }`}>
          {message.kind === 'error' ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </p>
      )}

      <section className="space-y-2 pt-2">
        <h2 className="text-sm font-semibold text-text-secondary">ZONA DE PERIGO</h2>
        <button
          type="button"
          onClick={handleClear}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-danger ring-1 ring-danger/40 transition-colors active:bg-danger/10">
          <Trash2 size={16} /> Apagar todos os dados
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-selected px-2 py-2">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="truncate text-xs text-text-secondary">{label}</p>
    </div>
  );
}
