'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            This account isn&apos;t authorized to use this panel. Only one specific Google account has access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
            Back to login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
