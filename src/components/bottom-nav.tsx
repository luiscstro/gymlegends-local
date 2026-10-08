import { Calendar, ClipboardList, Database, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/today', label: 'Hoje', icon: Calendar },
  { to: '/routine', label: 'Rotina', icon: ClipboardList },
  { to: '/history', label: 'Histórico', icon: History },
  { to: '/data', label: 'Dados', icon: Database },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[var(--safe-bottom)] backdrop-blur-md">
      <div className="mx-auto flex h-[var(--nav-height)] max-w-md items-stretch justify-around px-[env(safe-area-inset-left)] sm:max-w-lg">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }>
            <Icon size={22} strokeWidth={2} className="shrink-0" />
            <span className="max-w-full truncate px-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
