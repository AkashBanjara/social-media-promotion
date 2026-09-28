'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label, Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageUploader, type UploadedImage } from '@/components/posts/image-uploader';
import { PlatformSelector } from '@/components/posts/platform-selector';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { SocialPlatform } from '@/types';

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [image, setImage] = useState<UploadedImage | null>(null);
  const [caption, setCaption] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<SocialPlatform[]>([]);
  const [submitting, setSubmitting] = useState<'publish' | 'draft' | null>(null);

  useEffect(() => {
    fetch('/api/social/accounts')
      .then((res) => res.json())
      .then((data) => {
        const connected = data.accounts?.filter((a: { connected: boolean }) => a.connected).map((a: { platform: SocialPlatform }) => a.platform);
        setConnectedPlatforms(connected ?? []);
      });
  }, []);

  const submit = async (saveAsDraft: boolean) => {
    if (!image) return toast({ variant: 'destructive', title: 'Add an image first.' });
    if (!caption.trim()) return toast({ variant: 'destructive', title: 'Caption is required.' });
    if (!saveAsDraft && platforms.length === 0) {
      return toast({ variant: 'destructive', title: 'Select at least one platform.' });
    }

    setSubmitting(saveAsDraft ? 'draft' : 'publish');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.url,
          cloudinaryPublicId: image.publicId,
          caption,
          websiteUrl,
          hashtags,
          platforms,
          saveAsDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      if (saveAsDraft) {
        toast({ title: 'Draft saved.' });
      } else {
        const failedCount = data.results?.filter((r: { success: boolean }) => !r.success).length ?? 0;
        toast({
          title: failedCount === 0 ? 'Published successfully!' : 'Published with some failures',
          description: failedCount > 0 ? `${failedCount} platform(s) failed — check Post History for details.` : undefined,
          variant: failedCount === 0 ? 'success' : 'destructive',
        });
      }
      router.push(`/post-history/${data.post._id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create Post</h1>
        <p className="text-sm text-muted-foreground">
          Upload the image you finished in ChatGPT, write your caption, then publish everywhere at once.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Image</CardTitle>
          <CardDescription>The final promotional image, edited elsewhere and ready to publish.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader value={image} onChange={setImage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write your caption…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Website URL (optional)</Label>
            <Input id="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com/product" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#product #launch #india" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Platforms</CardTitle>
          <CardDescription>Only connected accounts can be selected. Connect more from Social Accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSelector selected={platforms} onChange={setPlatforms} connectedPlatforms={connectedPlatforms} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => submit(true)} disabled={submitting !== null}>
          {submitting === 'draft' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save as Draft
        </Button>
        <Button onClick={() => submit(false)} disabled={submitting !== null}>
          {submitting === 'publish' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Now
        </Button>
      </div>
    </div>
  );
}
