import { metaFetch, MetaApiError } from './meta';

/**
 * Instagram Graph API publishing flow (spec §10).
 * Requires: IG account must be Professional (Business/Creator) and linked to a Page.
 * Docs: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

export interface InstagramPublishParams {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string; // must be a publicly reachable HTTPS URL (Cloudinary URL satisfies this)
  caption: string;
}

export interface InstagramPublishResult {
  mediaId: string;
}

const MAX_STATUS_POLLS = 10;
const POLL_INTERVAL_MS = 2000;

/** Step 1: create a media container from the image URL + caption. */
async function createMediaContainer(params: InstagramPublishParams): Promise<string> {
  const json = await metaFetch<{ id: string }>(
    `/${params.igUserId}/media`,
    {
      image_url: params.imageUrl,
      caption: params.caption,
      access_token: params.pageAccessToken,
    },
    'POST'
  );
  return json.id;
}

/** Step 2: poll container status until FINISHED (or ERROR/EXPIRED). */
async function waitForContainerReady(containerId: string, pageAccessToken: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_STATUS_POLLS; attempt++) {
    const json = await metaFetch<{ status_code: string }>(`/${containerId}`, {
      fields: 'status_code',
      access_token: pageAccessToken,
    });

    if (json.status_code === 'FINISHED') return;
    if (json.status_code === 'ERROR' || json.status_code === 'EXPIRED') {
      throw new MetaApiError(`Instagram media container failed to process (status: ${json.status_code}).`);
    }
    // IN_PROGRESS or PUBLISHED — keep waiting / or already good to go
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new MetaApiError('Timed out waiting for Instagram media container to finish processing.');
}

/** Step 3: publish the container. */
async function publishContainer(igUserId: string, containerId: string, pageAccessToken: string): Promise<string> {
  const json = await metaFetch<{ id: string }>(
    `/${igUserId}/media_publish`,
    { creation_id: containerId, access_token: pageAccessToken },
    'POST'
  );
  return json.id;
}

export async function publishToInstagram(params: InstagramPublishParams): Promise<InstagramPublishResult> {
  const containerId = await createMediaContainer(params);
  await waitForContainerReady(containerId, params.pageAccessToken);
  const mediaId = await publishContainer(params.igUserId, containerId, params.pageAccessToken);
  return { mediaId };
}
