'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Megaphone className="h-6 w-6" />
          </div>
          <CardTitle>Marketing Panel</CardTitle>
          <CardDescription>Private single-user dashboard. Sign in with the authorized Google account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
