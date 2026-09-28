import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { processCampaign } from '@/lib/email/queue';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitCheck = rateLimit(
    `campaign-send:${session.user.email}`,
    RATE_LIMITS.campaignSend.limit,
    RATE_LIMITS.campaignSend.windowMs
  );
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Too many send attempts. Try again shortly.' }, { status: 429 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  try {
    const result = await processCampaign(params.id, session.user.email, appUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Campaign send failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
