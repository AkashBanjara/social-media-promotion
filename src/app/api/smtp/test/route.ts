import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { testSmtpConnection, getSmtpConfig } from '@/lib/email/smtp';
import { smtpConfigSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitCheck = rateLimit(`smtp-test:${session.user.email}`, RATE_LIMITS.smtpTest.limit, RATE_LIMITS.smtpTest.windowMs);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Too many test attempts. Try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));

  // If the form supplied fresh values (e.g. testing before saving), use those.
  // Otherwise fall back to whatever is already saved.
  if (body?.host) {
    const parsed = smtpConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
    }
    if (!parsed.data.password) {
      return NextResponse.json({ error: 'Password is required to test the connection.' }, { status: 400 });
    }
    const result = await testSmtpConnection({ ...parsed.data, password: parsed.data.password });
    return NextResponse.json(result);
  }

  const saved = await getSmtpConfig(session.user.email);
  if (!saved) return NextResponse.json({ error: 'No SMTP configuration saved yet.' }, { status: 400 });

  const result = await testSmtpConnection(saved);
  return NextResponse.json(result);
}
