import nodemailer, { type Transporter } from 'nodemailer';
import { connectDB } from '@/lib/db';
import { SmtpConfig, getSmtpPassword, type ISmtpConfig } from '@/models/SmtpConfig';

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

/**
 * Loads SMTP config from the database (Settings UI); falls back to
 * environment variables if nothing has been saved yet.
 */
export async function getSmtpConfig(userId: string): Promise<ResolvedSmtpConfig | null> {
  await connectDB();
  const saved = (await SmtpConfig.findOne({ userId }).select('+passwordEncrypted')) as ISmtpConfig | null;

  if (saved) {
    return {
      host: saved.host,
      port: saved.port,
      username: saved.username,
      password: getSmtpPassword(saved),
      fromEmail: saved.fromEmail,
      fromName: saved.fromName,
      secure: saved.secure,
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      username: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      fromName: process.env.SMTP_FROM_NAME || 'Marketing Panel',
      secure: process.env.SMTP_SECURE === 'true',
    };
  }

  return null;
}

export function createTransporter(config: ResolvedSmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports (uses STARTTLS)
    auth: { user: config.username, pass: config.password },
  });
}

export async function testSmtpConnection(config: ResolvedSmtpConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMTP verification failed.' };
  }
}

export async function sendMail(
  config: ResolvedSmtpConfig,
  opts: { to: string; subject: string; html: string }
): Promise<{ messageId: string }> {
  const transporter = createTransporter(config);
  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  return { messageId: info.messageId };
}
