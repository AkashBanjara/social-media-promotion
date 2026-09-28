import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SmtpConfig, setSmtpPassword } from '@/models/SmtpConfig';
import { smtpConfigSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  // passwordEncrypted is select:false by default — never sent to the client.
  const config = await SmtpConfig.findOne({ userId: session.user.email }).lean();
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const parsed = smtpConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;

  let config = await SmtpConfig.findOne({ userId: session.user.email }).select('+passwordEncrypted');
  if (!config) {
    if (!password) {
      return NextResponse.json({ error: 'Password is required for first-time SMTP setup.' }, { status: 400 });
    }
    config = new SmtpConfig({ userId: session.user.email });
  }

  config.host = rest.host;
  config.port = rest.port;
  config.username = rest.username;
  config.fromEmail = rest.fromEmail;
  config.fromName = rest.fromName;
  config.secure = rest.secure;
  if (password) setSmtpPassword(config, password); // only overwrite if a new password was submitted

  await config.save();

  return NextResponse.json({ ok: true });
}
