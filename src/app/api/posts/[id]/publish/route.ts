import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { publishPost } from '@/lib/social/publisher';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitCheck = rateLimit(`publish:${session.user.email}`, RATE_LIMITS.publish.limit, RATE_LIMITS.publish.windowMs);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Too many publish attempts. Try again in a minute.' }, { status: 429 });
  }

  try {
    const results = await publishPost(params.id, session.user.email);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publishing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
