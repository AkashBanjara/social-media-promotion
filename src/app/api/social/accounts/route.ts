import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SocialAccount } from '@/models/SocialAccount';

const PLATFORMS = ['instagram', 'facebook', 'linkedin'] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  // accessTokenEncrypted / refreshTokenEncrypted are select:false by default,
  // so this query never touches secrets.
  const accounts = await SocialAccount.find({ userId: session.user.email }).lean();

  const byPlatform = Object.fromEntries(accounts.map((a) => [a.platform, a]));

  const result = PLATFORMS.map((platform) => {
    const account = byPlatform[platform];
    return {
      platform,
      connected: account?.status === 'connected',
      accountId: account?.accountId ?? null,
      accountName: account?.accountName ?? null,
      expiresAt: account?.expiresAt ?? null,
    };
  });

  return NextResponse.json({ accounts: result });
}
