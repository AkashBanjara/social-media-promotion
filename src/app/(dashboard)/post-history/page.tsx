'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlatformBadge, StatusBadge } from '@/components/posts/platform-status';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, truncate } from '@/lib/utils';
import type { SocialPlatform } from '@/types';

interface PostRow {
  _id: string;
  imageUrl: string;
  caption: string;
  websiteUrl?: string;
  hashtags: string[];
  platforms: SocialPlatform[];
  status: string;
  createdAt: string;
}

export default function PostHistoryPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (platform !== 'all') params.set('platform', platform);
    if (status !== 'all') params.set('status', status);

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }, [search, platform, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Post History</h1>
        <p className="text-sm text-muted-foreground">Everything you&apos;ve published or saved as a draft.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search captions…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No posts match your filters yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/post-history/${post._id}`}>
                        <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                          <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/post-history/${post._id}`} className="hover:underline">
                        {truncate(post.caption, 70)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
