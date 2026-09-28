import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contact } from '@/models/Contact';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const contacts = await Contact.find().sort({ createdAt: -1 }).lean();

  const csv = Papa.unparse(
    contacts.map((c) => ({
      name: c.name,
      email: c.email,
      tags: c.tags.join('|'),
      subscribed: c.subscribed,
      createdAt: c.createdAt,
    }))
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${Date.now()}.csv"`,
    },
  });
}
