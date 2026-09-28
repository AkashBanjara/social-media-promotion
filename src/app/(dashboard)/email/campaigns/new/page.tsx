'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState('');
  const [content, setContent] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [recipientPreview, setRecipientPreview] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tags = tagFilter.split(',').map((t) => t.trim()).filter(Boolean);
    const params = new URLSearchParams();
    if (tags.length) tags.forEach((t) => params.append('tag', t));
    fetch(`/api/contacts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRecipientPreview((data.contacts ?? []).filter((c: { subscribed: boolean }) => c.subscribed).length));
  }, [tagFilter]);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          fromName,
          content,
          tagFilter: tagFilter.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign.');
      toast({ title: 'Campaign created.' });
      router.push(`/email/campaigns/${data.campaign._id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Campaign</h1>
        <p className="text-sm text-muted-foreground">Draft it here, then send from the campaign page once ready.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Campaign name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="October Product Launch" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Introducing our new product 🚀" />
          </div>
          <div className="space-y-1.5">
            <Label>From name</Label>
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Business Name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email content (HTML supported)</Label>
            <Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="<p>Write your email…</p>" />
          </div>
          <div className="space-y-1.5">
            <Label>Send only to tags (optional, comma separated — leave blank for all subscribed contacts)</Label>
            <Input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="vip, newsletter" />
          </div>
          <p className="text-sm text-muted-foreground">
            Recipients: <span className="font-medium text-foreground">{recipientPreview ?? '—'}</span>
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={create} disabled={saving || !name || !subject || !fromName || !content}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Campaign
        </Button>
      </div>
    </div>
  );
}
