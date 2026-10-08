import { SET_TYPE_LABELS, SET_TYPE_SHORT, SET_TYPE_TEXT_COLORS, type SetType } from '@/types/models';

const BG_VAR: Record<SetType, string> = {
  warmup: 'var(--color-set-warmup)',
  feeder: 'var(--color-set-feeder)',
  work: 'var(--color-set-work)',
  top: 'var(--color-set-top)',
  cluster: 'var(--color-set-cluster)',
};

interface SetTypeBadgeProps {
  setType: SetType;
  onClick?: () => void;
  size?: number;
}

/** Badge quadrado e compacto (letra única). Clicar cicla o tipo, quando houver onClick. */
export function SetTypeBadge({ setType, onClick, size = 36 }: SetTypeBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={onClick ? `Tipo de série: ${SET_TYPE_LABELS[setType]}. Toque para trocar` : SET_TYPE_LABELS[setType]}
      title={SET_TYPE_LABELS[setType]}
      style={{ backgroundColor: BG_VAR[setType], width: size, height: size, color: SET_TYPE_TEXT_COLORS[setType] }}
      className="flex shrink-0 items-center justify-center rounded-md text-sm font-bold transition-transform enabled:active:scale-90 disabled:opacity-100">
      {SET_TYPE_SHORT[setType]}
    </button>
  );
}
