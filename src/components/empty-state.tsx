import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-row-enter flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-text-secondary">
        <Icon size={26} />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
