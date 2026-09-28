import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SocialAccount } from '@/models/SocialAccount';

export async function POST(req: NextRequest, { params }: { params: { platform: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await SocialAccount.deleteOne({ userId: session.user.email, platform: params.platform });

  return NextResponse.json({ ok: true });
}
