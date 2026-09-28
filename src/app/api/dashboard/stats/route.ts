import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import { Contact } from '@/models/Contact';
import { EmailCampaign } from '@/models/EmailCampaign';
import { SocialAccount } from '@/models/SocialAccount';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = session.user.email;

  const [
    totalPosts,
    successfulPosts,
    failedPosts,
    totalCampaigns,
    totalContacts,
    connectedAccounts,
    recentPosts,
    recentCampaigns,
  ] = await Promise.all([
    Post.countDocuments({ userId }),
    Post.countDocuments({ userId, status: { $in: ['published', 'partial'] } }),
    Post.countDocuments({ userId, status: 'failed' }),
    EmailCampaign.countDocuments(),
    Contact.countDocuments(),
    SocialAccount.countDocuments({ userId, status: 'connected' }),
    Post.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    EmailCampaign.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return NextResponse.json({
    totalPosts,
    successfulPosts,
    failedPosts,
    totalCampaigns,
    totalContacts,
    connectedAccounts,
    recentPosts,
    recentCampaigns,
  });
}
