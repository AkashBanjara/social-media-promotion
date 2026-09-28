'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export function ImageUploader({
  value,
  onChange,
}: {
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed.');
        onChange({ url: data.url, publicId: data.publicId, width: data.width, height: data.height });
        if (data.warning) setError(data.warning);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) upload(file);
  };

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border">
        <div className="relative aspect-square w-full bg-muted sm:aspect-video">
          <Image src={value.url} alt="Post preview" fill className="object-contain" sizes="100vw" />
        </div>
        <div className="flex items-center justify-between border-t border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">
            {value.width}×{value.height}px
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="mr-1 h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center transition-colors',
          dragActive && 'border-primary bg-primary/5'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">Drag & drop your image here</p>
        <p className="text-xs text-muted-foreground">JPEG, PNG or WEBP, up to 10MB</p>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Browse files'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
