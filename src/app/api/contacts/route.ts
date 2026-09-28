import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contact } from '@/models/Contact';
import { contactSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const tag = searchParams.get('tag');

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }
  if (tag) filter.tags = tag;

  const contacts = await Contact.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  try {
    const contact = await Contact.create({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      unsubscribeToken: crypto.randomBytes(20).toString('hex'),
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'A contact with this email already exists.' }, { status: 409 });
    }
    console.error('[contacts:create]', err);
    return NextResponse.json({ error: 'Failed to create contact.' }, { status: 500 });
  }
}
