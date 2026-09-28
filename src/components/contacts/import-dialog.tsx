'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UploadCloud } from 'lucide-react';

export function ImportContactsDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');
      toast({
        title: `Imported ${data.imported} contact(s)`,
        description: data.skipped > 0 ? `${data.skipped} row(s) skipped (duplicates or invalid).` : undefined,
      });
      onImported();
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Import failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <code>name, email, tags</code> (tags separated by | or comma). Duplicate emails are skipped.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm">{file ? file.name : 'Click to choose a CSV file'}</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
