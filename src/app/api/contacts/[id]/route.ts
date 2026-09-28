import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contact } from '@/models/Contact';
import { contactSchema } from '@/lib/validations';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  try {
    const update: Record<string, unknown> = { ...parsed.data };
    if (typeof body.subscribed === 'boolean') update.subscribed = body.subscribed;
    if (update.email) update.email = (update.email as string).toLowerCase();

    const contact = await Contact.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
    if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
    return NextResponse.json({ contact });
  } catch (err: unknown) {
    if (typeof err === 'object' && err && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'A contact with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update contact.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await Contact.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
