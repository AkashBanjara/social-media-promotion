'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/posts/platform-status';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  fromName: string;
  content: string;
  recipientCount: number;
  status: string;
  createdAt: string;
  sentAt?: string;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [summary, setSummary] = useState<{ sent: number; failed: number; queued: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaign(data.campaign);
        setSummary(data.summary);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!confirm(`Send this campaign to ${campaign?.recipientCount} recipients now? This cannot be undone.`)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `Campaign sent: ${data.sent} succeeded, ${data.failed} failed.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Send failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSending(false);
    }
  };

  if (loading || !campaign) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(campaign.createdAt)}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Subject:</span> {campaign.subject}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">From:</span> {campaign.fromName}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Recipients:</span> {campaign.recipientCount}
          </p>
          <div className="rounded-md border border-border p-4 text-sm" dangerouslySetInnerHTML={{ __html: campaign.content }} />
        </CardContent>
      </Card>

      {summary && (campaign.status === 'sending' || campaign.status === 'sent' || campaign.status === 'failed') && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-success">{summary.sent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-destructive">{summary.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{summary.queued}</p>
              <p className="text-xs text-muted-foreground">Queued</p>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.status === 'draft' && (
        <div className="flex justify-end">
          <Button onClick={send} disabled={sending || campaign.recipientCount === 0}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Campaign
          </Button>
        </div>
      )}
    </div>
  );
}
