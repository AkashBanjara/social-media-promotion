'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Instagram, Facebook, Linkedin, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import type { SocialPlatform } from '@/types';

interface AccountStatus {
  platform: SocialPlatform;
  connected: boolean;
  accountId: string | null;
  accountName: string | null;
  expiresAt: string | null;
}

const PLATFORM_META: Record<SocialPlatform, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, description: 'Requires a Professional (Business/Creator) account linked to a Facebook Page.' },
  facebook: { label: 'Facebook', icon: Facebook, description: 'Publishes to a Facebook Page you manage — not a personal profile.' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, description: 'Publishes as your LinkedIn member profile.' },
};

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch('/api/social/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) toast({ title: `${connected === 'meta' ? 'Meta (Facebook/Instagram)' : 'LinkedIn'} connected.`, variant: 'success' });
    if (error) toast({ variant: 'destructive', title: 'Connection failed', description: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async (platform: SocialPlatform) => {
    if (!confirm(`Disconnect ${PLATFORM_META[platform].label}? You'll need to reconnect to publish there again.`)) return;
    await fetch(`/api/social/${platform}/disconnect`, { method: 'POST' });
    toast({ title: `${PLATFORM_META[platform].label} disconnected.` });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Social Accounts</h1>
        <p className="text-sm text-muted-foreground">Connect the accounts you want to publish to. No passwords are ever requested.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)
          : accounts.map((account) => {
              const meta = PLATFORM_META[account.platform];
              const Icon = meta.icon;
              return (
                <Card key={account.platform}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-base">{meta.label}</CardTitle>
                      </div>
                      {account.connected ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" /> Not Connected
                        </span>
                      )}
                    </div>
                    <CardDescription>{meta.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {account.connected ? (
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Account:</span> {account.accountName}
                        </p>
                        <p className="truncate">
                          <span className="text-muted-foreground">ID:</span> {account.accountId}
                        </p>
                        {account.expiresAt && (
                          <p className="text-xs text-muted-foreground">Token expires {formatDate(account.expiresAt)}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not connected yet.</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {account.connected ? (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/api/social/connect/${account.platform}`}>Reconnect</a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => disconnect(account.platform)}>
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" asChild>
                          <a href={`/api/social/connect/${account.platform}`}>Connect</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
