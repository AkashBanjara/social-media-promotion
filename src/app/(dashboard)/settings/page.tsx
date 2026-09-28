'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SmtpForm {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

const EMPTY_FORM: SmtpForm = { host: '', port: '587', username: '', password: '', fromEmail: '', fromName: '', secure: false };

export default function SettingsPage() {
  const [form, setForm] = useState<SmtpForm>(EMPTY_FORM);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/settings/smtp')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setHasSaved(true);
          setForm({
            host: data.config.host,
            port: String(data.config.port),
            username: data.config.username,
            password: '',
            fromEmail: data.config.fromEmail,
            fromName: data.config.fromName,
            secure: data.config.secure,
          });
        }
      });
  }, []);

  const update = <K extends keyof SmtpForm>(key: K, value: SmtpForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, port: Number(form.port) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save SMTP settings.');
      toast({ title: 'SMTP settings saved.' });
      setHasSaved(true);
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const usingSavedPassword = hasSaved && !form.password;
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: usingSavedPassword ? JSON.stringify({}) : JSON.stringify({ ...form, port: Number(form.port) }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: 'Test request failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure SMTP for sending email campaigns.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>Your SMTP password is encrypted at rest and never sent back to the browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Host</Label>
              <Input value={form.host} onChange={(e) => update('host', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input value={form.port} onChange={(e) => update('port', e.target.value)} placeholder="587" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => update('username', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Password {hasSaved && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
            <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>From email</Label>
              <Input type="email" value={form.fromEmail} onChange={(e) => update('fromEmail', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>From name</Label>
              <Input value={form.fromName} onChange={(e) => update('fromName', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={form.secure} onCheckedChange={(v) => update('secure', v === true)} />
            <span className="text-sm">Use TLS/SSL (typically for port 465)</span>
          </label>

          {testResult && (
            <div className={`flex items-center gap-2 rounded-md border p-3 text-sm ${testResult.ok ? 'border-success text-success' : 'border-destructive text-destructive'}`}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.ok ? 'Connection successful.' : testResult.error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={test} disabled={testing || !form.host}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button onClick={save} disabled={saving || !form.host || !form.username || (!hasSaved && !form.password)}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
