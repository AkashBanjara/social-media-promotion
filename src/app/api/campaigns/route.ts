import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { EmailCampaign } from '@/models/EmailCampaign';
import { Contact } from '@/models/Contact';
import { campaignSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const campaigns = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const contactFilter: Record<string, unknown> = { subscribed: true };
  if (parsed.data.tagFilter.length) contactFilter.tags = { $in: parsed.data.tagFilter };
  const recipientCount = await Contact.countDocuments(contactFilter);

  const campaign = await EmailCampaign.create({ ...parsed.data, recipientCount, status: 'draft' });
  return NextResponse.json({ campaign }, { status: 201 });
}
