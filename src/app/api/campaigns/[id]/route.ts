import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { EmailCampaign, EmailLog } from '@/models/EmailCampaign';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const campaign = await EmailCampaign.findById(params.id).lean();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });

  const logs = await EmailLog.find({ campaignId: params.id }).sort({ createdAt: -1 }).limit(500).lean();
  const summary = {
    sent: logs.filter((l) => l.status === 'sent').length,
    failed: logs.filter((l) => l.status === 'failed').length,
    queued: logs.filter((l) => l.status === 'queued' || l.status === 'sending').length,
  };

  return NextResponse.json({ campaign, logs, summary });
}
