import type { SocialPlatform } from '@/types';

/**
 * Combines caption + website URL + hashtags into the final text sent to each
 * platform. Deliberately platform-aware instead of blind concatenation
 * (spec §6: "Do not blindly duplicate malformed content").
 */
export function composeContent(
  platform: SocialPlatform,
  input: { caption: string; websiteUrl?: string; hashtags: string[] }
): string {
  const { caption, websiteUrl, hashtags } = input;
  const hashtagLine = hashtags.length ? hashtags.join(' ') : '';

  switch (platform) {
    case 'instagram':
      // IG has no clickable links in captions — a URL is still shown as plain
      // text (useful for typed-out/bio-referenced links) but we don't pretend
      // it's clickable. Hashtags go on their own line at the end, IG-style.
      return [caption, websiteUrl ? `🔗 ${websiteUrl}` : '', hashtagLine].filter(Boolean).join('\n\n');

    case 'facebook':
      // Facebook renders URLs as clickable + auto-unfurls a preview card.
      return [caption, websiteUrl, hashtagLine].filter(Boolean).join('\n\n');

    case 'linkedin':
      // LinkedIn: keep it professional — fewer hashtags read better, but we
      // don't truncate the user's own tags, just place them last.
      return [caption, websiteUrl, hashtagLine].filter(Boolean).join('\n\n');

    default:
      return [caption, websiteUrl, hashtagLine].filter(Boolean).join('\n\n');
  }
}
