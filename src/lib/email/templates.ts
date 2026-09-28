/**
 * Wraps campaign content with a required unsubscribe footer (spec §19 —
 * "Provide an unsubscribe link in promotional emails"). Every send goes
 * through this so there is no code path that can send a campaign email
 * without one.
 */
export function renderCampaignEmail(params: { contentHtml: string; unsubscribeUrl: string; fromName: string }) {
  const { contentHtml, unsubscribeUrl, fromName } = params;
  return `
<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1a1a1a; max-width: 640px; margin: 0 auto;">
    <div style="padding: 24px 0;">
      ${contentHtml}
    </div>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
    <p style="font-size: 12px; color: #888;">
      You're receiving this email from ${escapeHtml(fromName)}.
      <a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a> at any time.
    </p>
  </body>
</html>`.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
