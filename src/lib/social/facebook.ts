import { metaFetch } from './meta';

/**
 * Facebook Page publishing (spec §11). Always publishes to a Page, never a
 * personal profile — the Meta Graph API does not support publishing to
 * personal profiles for third-party apps in any case.
 * Docs: https://developers.facebook.com/docs/pages-api/posts
 */

export interface FacebookPublishParams {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  message: string; // caption + url + hashtags combined
}

export interface FacebookPublishResult {
  postId: string;
}

export async function publishToFacebook(params: FacebookPublishParams): Promise<FacebookPublishResult> {
  // /{page-id}/photos publishes an image post with a caption in one call and
  // returns a post_id (in addition to the photo id).
  const json = await metaFetch<{ id: string; post_id?: string }>(
    `/${params.pageId}/photos`,
    {
      url: params.imageUrl,
      caption: params.message,
      access_token: params.pageAccessToken,
    },
    'POST'
  );
  return { postId: json.post_id ?? json.id };
}
