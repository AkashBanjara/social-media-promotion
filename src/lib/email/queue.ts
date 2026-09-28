/**
 * Email sending "queue" (spec §18).
 *
 * V1 deliberately does NOT introduce Redis/BullMQ — the app is single-user,
 * low-volume, and meant to run on free tiers. Instead this module gives the
 * rest of the app a queue-shaped API (`enqueue`, per-recipient status rows in
 * EmailLog) so that swapping the internals for a real worker later is a
 * contained change: only `processCampaign()` below needs to change from
 * "run inline" to "hand off to a BullMQ worker"; nothing in the API routes,
 * models, or UI would need to change.
 *
 * Trade-off you should know about: this runs inline in the API route's
 * request lifecycle. On Vercel it's bounded by the function's max execution
 * time, so it comfortably handles small-to-medium contact lists but is not
 * suited to very large campaigns without upgrading to a real background
 * worker (see README "Scaling the email queue").
 */
import { connectDB } from '@/lib/db';
import { Contact, type IContact } from '@/models/Contact';
import { EmailCampaign, EmailLog, type EmailDeliveryStatus } from '@/models/EmailCampaign';
import { getSmtpConfig, sendMail } from './smtp';
import { renderCampaignEmail } from './templates';

const SEND_DELAY_MS = 300; // basic pacing to stay within common SMTP provider rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processCampaign(campaignId: string, userId: string, appUrl: string) {
  await connectDB();

  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) throw new Error('Campaign not found.');

  const smtpConfig = await getSmtpConfig(userId);
  if (!smtpConfig) {
    campaign.status = 'failed';
    await campaign.save();
    throw new Error('No SMTP configuration found. Add one under Settings → SMTP.');
  }

  const contactFilter: Record<string, unknown> = { subscribed: true };
  if (campaign.tagFilter?.length) contactFilter.tags = { $in: campaign.tagFilter };

  const contacts = await Contact.find(contactFilter);

  campaign.status = 'sending';
  campaign.recipientCount = contacts.length;
  await campaign.save();

  // Pre-create queued log rows so progress/status is visible immediately.
  const logs = await EmailLog.insertMany(
    contacts.map((c: IContact) => ({
      campaignId: campaign._id,
      contactId: c._id,
      recipient: c.email,
      status: 'queued' as EmailDeliveryStatus,
    }))
  );

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const log = logs[i];
    if (!contact || !log) continue;

    try {
      log.status = 'sending';
      await log.save();

      const unsubscribeUrl = `${appUrl}/unsubscribe?token=${contact.unsubscribeToken}`;
      const html = renderCampaignEmail({
        contentHtml: campaign.content,
        unsubscribeUrl,
        fromName: campaign.fromName,
      });

      await sendMail(
        { ...smtpConfig, fromName: campaign.fromName },
        { to: contact.email, subject: campaign.subject, html }
      );

      log.status = 'sent';
      log.sentAt = new Date();
      sentCount++;
    } catch (err) {
      log.status = 'failed';
      log.error = err instanceof Error ? err.message : 'Unknown send error';
      failedCount++;
    }
    await log.save();

    if (i < contacts.length - 1) await sleep(SEND_DELAY_MS);
  }

  campaign.status = failedCount === contacts.length && contacts.length > 0 ? 'failed' : 'sent';
  campaign.sentAt = new Date();
  await campaign.save();

  return { total: contacts.length, sent: sentCount, failed: failedCount };
}
