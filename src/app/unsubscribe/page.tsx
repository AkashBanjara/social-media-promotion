import { connectDB } from '@/lib/db';
import { Contact } from '@/models/Contact';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailX } from 'lucide-react';

async function unsubscribe(token: string | undefined) {
  if (!token) return { ok: false as const, message: 'Missing unsubscribe token.' };

  await connectDB();
  const contact = await Contact.findOne({ unsubscribeToken: token });
  if (!contact) return { ok: false as const, message: 'This unsubscribe link is invalid or has expired.' };

  if (contact.subscribed) {
    contact.subscribed = false;
    await contact.save();
  }

  return { ok: true as const, email: contact.email };
}

export default async function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  const result = await unsubscribe(searchParams.token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <MailX className="h-6 w-6" />
          </div>
          <CardTitle>{result.ok ? "You're unsubscribed" : 'Something went wrong'}</CardTitle>
          <CardDescription>
            {result.ok
              ? `${result.email} won't receive any more promotional emails from us.`
              : result.message}
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
