'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, CheckCircle2, XCircle, Send, Users, Share2 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/posts/platform-status';
import { formatDate, truncate } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A quick look at everything happening in your panel.</p>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Posts" value={stats.totalPosts} icon={FileText} />
          <StatCard label="Successful Posts" value={stats.successfulPosts} icon={CheckCircle2} tone="success" />
          <StatCard label="Failed Posts" value={stats.failedPosts} icon={XCircle} tone="destructive" />
          <StatCard label="Email Campaigns" value={stats.totalCampaigns} icon={Send} />
          <StatCard label="Contacts" value={stats.totalContacts} icon={Users} />
          <StatCard label="Connected Accounts" value={stats.connectedAccounts} icon={Share2} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Posts</CardTitle>
            <Link href="/post-history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recentPosts?.length && !loading && (
              <p className="text-sm text-muted-foreground">No posts yet. Create your first one.</p>
            )}
            {stats?.recentPosts?.map((post) => (
              <Link
                key={post._id}
                href={`/post-history/${post._id}`}
                className="flex items-center gap-3 rounded-md border border-border p-2 hover:bg-accent"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{truncate(post.caption, 60)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
                <StatusBadge status={post.status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Campaigns</CardTitle>
            <Link href="/email/campaigns" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recentCampaigns?.length && !loading && (
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            )}
            {stats?.recentCampaigns?.map((c) => (
              <Link
                key={c._id}
                href={`/email/campaigns/${c._id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.recipientCount} recipients · {formatDate(c.createdAt)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
