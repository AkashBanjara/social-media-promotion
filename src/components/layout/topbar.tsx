'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="md:hidden font-semibold">Marketing Panel</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        {session?.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        )}
        <span className="hidden text-sm text-muted-foreground sm:inline">{session?.user?.email}</span>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
