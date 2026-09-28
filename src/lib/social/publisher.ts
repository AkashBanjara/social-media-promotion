import { connectDB } from '@/lib/db';
import { Post, PostPlatformResult, type IPost } from '@/models/Post';
import { SocialAccount, getAccessToken, type ISocialAccount } from '@/models/SocialAccount';
import { publishToInstagram } from './instagram';
import { publishToFacebook } from './facebook';
import { publishToLinkedIn } from './linkedin';
import { composeContent } from './compose';
import type { PublishResult, SocialPlatform } from '@/types';

/**
 * Unified publishing engine (spec §13).
 *
 * Contract: one platform failing must NEVER fail or block the others. Every
 * platform gets its own try/catch and its own PostPlatformResult row, and the
 * Post's overall `status` is derived only after every platform has settled.
 */
export async function publishPost(postId: string, userId: string): Promise<PublishResult[]> {
  await connectDB();

  const post = await Post.findOne({ _id: postId, userId });
  if (!post) throw new Error('Post not found.');

  post.status = 'publishing';
  await post.save();

  const results = await Promise.all(post.platforms.map((platform) => publishToPlatform(post, userId, platform)));

  post.status = deriveOverallStatus(results);
  await post.save();

  return results;
}

async function publishToPlatform(
  post: IPost,
  userId: string,
  platform: SocialPlatform
): Promise<PublishResult> {
  try {
    const account = await SocialAccount.findOne({ userId, platform, status: 'connected' }).select(
      '+accessTokenEncrypted'
    );
    if (!account) {
      throw new Error(`No connected ${platform} account. Connect it from Social Accounts first.`);
    }

    const content = composeContent(platform, {
      caption: post.caption,
      websiteUrl: post.websiteUrl,
      hashtags: post.hashtags,
    });

    const externalPostId = await dispatchToPlatform(platform, account, post.imageUrl, content);

    await upsertResult(post.id, platform, {
      status: 'success',
      externalPostId,
      publishedAt: new Date(),
      error: undefined,
    });

    return { platform, success: true, externalPostId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error while publishing.';
    await upsertResult(post.id, platform, { status: 'failed', error: message });
    return { platform, success: false, error: message };
  }
}

async function dispatchToPlatform(
  platform: SocialPlatform,
  account: ISocialAccount,
  imageUrl: string,
  content: string
): Promise<string> {
  const accessToken = getAccessToken(account);

  switch (platform) {
    case 'instagram': {
      const igUserId = account.accountId;
      const result = await publishToInstagram({ igUserId, pageAccessToken: accessToken, imageUrl, caption: content });
      return result.mediaId;
    }
    case 'facebook': {
      const pageId = account.accountId;
      const result = await publishToFacebook({ pageId, pageAccessToken: accessToken, imageUrl, message: content });
      return result.postId;
    }
    case 'linkedin': {
      const personUrn = account.accountId; // stored as "urn:li:person:{sub}"
      const result = await publishToLinkedIn({ personUrn, accessToken, imageUrl, text: content });
      return result.postId;
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function upsertResult(
  postId: unknown,
  platform: SocialPlatform,
  data: { status: 'success' | 'failed'; externalPostId?: string; publishedAt?: Date; error?: string }
) {
  await PostPlatformResult.findOneAndUpdate(
    { postId, platform },
    { postId, platform, ...data },
    { upsert: true, new: true }
  );
}

function deriveOverallStatus(results: PublishResult[]): IPost['status'] {
  const successCount = results.filter((r) => r.success).length;
  if (successCount === 0) return 'failed';
  if (successCount === results.length) return 'published';
  return 'partial';
}
