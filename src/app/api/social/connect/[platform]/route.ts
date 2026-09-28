import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMetaOAuthUrl } from '@/lib/social/meta';
import { getLinkedInOAuthUrl } from '@/lib/social/linkedin';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const VALID_PLATFORMS = ['facebook', 'instagram', 'linkedin'];

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL('/login', req.url));

  if (!VALID_PLATFORMS.includes(params.platform)) {
    return NextResponse.json({ error: 'Unknown platform.' }, { status: 400 });
  }

  const limitCheck = rateLimit(
    `connect:${session.user.email}`,
    RATE_LIMITS.socialConnect.limit,
    RATE_LIMITS.socialConnect.windowMs
  );
  if (!limitCheck.allowed) {
    return NextResponse.redirect(new URL('/social-accounts?error=rate_limited', req.url));
  }

  const state = crypto.randomBytes(24).toString('hex');

  // Instagram and Facebook both go through the same Meta OAuth dialog — a
  // connected Facebook Page's linked Instagram Professional account is
  // discovered automatically in the callback.
  const oauthUrl =
    params.platform === 'linkedin' ? getLinkedInOAuthUrl(state) : getMetaOAuthUrl(state);

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  return response;
}
