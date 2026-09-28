'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBadge, StatusBadge } from '@/components/posts/platform-status';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { PLATFORM_LABELS, type SocialPlatform } from '@/types';
import { RefreshCw, Trash2, ExternalLink } from 'lucide-react';

interface PlatformResult {
  platform: SocialPlatform;
  status: 'pending' | 'success' | 'failed';
  externalPostId?: string;
  publishedAt?: string;
  error?: string;
}

interface PostDetail {
  _id: string;
  imageUrl: string;
  caption: string;
  websiteUrl?: string;
  hashtags: string[];
  platforms: SocialPlatform[];
  status: string;
  createdAt: string;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data.post);
        setResults(data.results ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Publish attempt finished.' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Retry failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setRetrying(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Post deleted.' });
      router.push('/post-history');
    }
  };

  if (loading || !post) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Post Details</h1>
          <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {(post.status === 'failed' || post.status === 'partial' || post.status === 'draft') && (
            <Button variant="outline" onClick={retry} disabled={retrying}>
              <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
              {post.status === 'draft' ? 'Publish' : 'Retry Failed'}
            </Button>
          )}
          <Button variant="ghost" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row">
          <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="192px" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
            {post.websiteUrl && (
              <a href={post.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> {post.websiteUrl}
              </a>
            )}
            {post.hashtags?.length > 0 && <p className="text-sm text-muted-foreground">{post.hashtags.join(' ')}</p>}
            <div className="flex items-center gap-2 pt-1">
              <StatusBadge status={post.status} />
              {post.platforms.map((p) => (
                <PlatformBadge key={p} platform={p} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.map((r) => (
            <div key={r.platform} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">{PLATFORM_LABELS[r.platform]}</p>
                {r.externalPostId && <p className="text-xs text-muted-foreground">Post ID: {r.externalPostId}</p>}
                {r.publishedAt && <p className="text-xs text-muted-foreground">Published {formatDate(r.publishedAt)}</p>}
                {r.error && <p className="text-xs text-destructive">{r.error}</p>}
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
