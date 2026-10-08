import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/components/bottom-nav';

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto w-full max-w-md px-[env(safe-area-inset-left)] pb-[calc(var(--nav-height)+var(--safe-bottom)+1.5rem)] sm:max-w-lg">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
