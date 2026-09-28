import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Papa from 'papaparse';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contact } from '@/models/Contact';
import { contactImportRowSchema } from '@/lib/validations';

/**
 * Expects a CSV with headers: name,email,tags (tags is a comma or pipe
 * separated string within the cell, e.g. "vip|newsletter").
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No CSV file provided.' }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [index, row] of parsed.data.entries()) {
    const rowResult = contactImportRowSchema.safeParse({
      name: row.name?.trim(),
      email: row.email?.trim(),
      tags: row.tags?.trim(),
    });

    if (!rowResult.success) {
      skipped++;
      errors.push(`Row ${index + 2}: ${rowResult.error.issues[0]?.message ?? 'invalid row'}`);
      continue;
    }

    const tags = rowResult.data.tags
      ? rowResult.data.tags.split(/[|,]/).map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      await Contact.create({
        name: rowResult.data.name,
        email: rowResult.data.email.toLowerCase(),
        tags,
        unsubscribeToken: crypto.randomBytes(20).toString('hex'),
      });
      imported++;
    } catch (err: unknown) {
      skipped++;
      if (typeof err === 'object' && err && 'code' in err && (err as { code?: number }).code === 11000) {
        errors.push(`Row ${index + 2}: duplicate email (${rowResult.data.email}), skipped.`);
      } else {
        errors.push(`Row ${index + 2}: failed to save.`);
      }
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) });
}
