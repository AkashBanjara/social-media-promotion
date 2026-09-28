'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ImagePlus,
  History,
  Share2,
  Users,
  Send,
  Settings,
  Megaphone,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create-post', label: 'Create Post', icon: ImagePlus },
  { href: '/post-history', label: 'Post History', icon: History },
  { href: '/social-accounts', label: 'Social Accounts', icon: Share2 },
];

const EMAIL_ITEMS = [
  { href: '/email/contacts', label: 'Contacts', icon: Users },
  { href: '/email/campaigns', label: 'Campaigns', icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Megaphone className="h-4 w-4" />
        </div>
        <span className="font-semibold">Marketing Panel</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <div className="pt-4">
          <div className="flex items-center gap-2 px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Email Marketing
          </div>
          {EMAIL_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="pt-4">
          <NavLink href="/settings" label="Settings" icon={Settings} active={isActive('/settings')} />
        </div>
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
