/**
 * LinkedIn OAuth + publishing (spec §12).
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
 *
 * Required LinkedIn product/scopes (verify against your LinkedIn app's approved
 * products — "Share on LinkedIn" / "Sign In with LinkedIn using OpenID Connect"):
 *   - openid, profile, email  (identity)
 *   - w_member_social          (posting on the member's behalf)
 *
 * Kept isolated in this file per spec §12 so LinkedIn API changes don't ripple
 * into the rest of the publishing engine.
 */

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2';

export class LinkedInApiError extends Error {
  constructor(message: string, public raw?: unknown) {
    super(message);
    this.name = 'LinkedInApiError';
  }
}

export function getLinkedInOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID as string,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI as string,
    state,
    scope: 'openid profile email w_member_social',
  });
  return `${LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(`${LINKEDIN_AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI as string,
      client_id: process.env.LINKEDIN_CLIENT_ID as string,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET as string,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new LinkedInApiError(json?.error_description || 'LinkedIn token exchange failed', json);
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

export async function getLinkedInProfile(accessToken: string): Promise<{ sub: string; name: string }> {
  const res = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new LinkedInApiError('Failed to fetch LinkedIn profile', json);
  return { sub: json.sub, name: json.name };
}

interface LinkedInPublishParams {
  personUrn: string; // "urn:li:person:{sub}"
  accessToken: string;
  imageUrl: string;
  text: string;
}

interface LinkedInPublishResult {
  postId: string;
}

/** Registers an image upload, downloads it from our Cloudinary URL, and uploads bytes to LinkedIn. */
async function uploadImageToLinkedIn(personUrn: string, accessToken: string, imageUrl: string): Promise<string> {
  // Step 1: register the upload
  const registerRes = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }),
  });
  const registerJson = await registerRes.json();
  if (!registerRes.ok) throw new LinkedInApiError('LinkedIn upload registration failed', registerJson);

  const uploadUrl =
    registerJson.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
      .uploadUrl;
  const asset = registerJson.value.asset as string;

  // Step 2: fetch the image bytes from Cloudinary and PUT them to LinkedIn's upload URL
  const imageRes = await fetch(imageUrl);
  const imageBuffer = await imageRes.arrayBuffer();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: Buffer.from(imageBuffer),
  });
  if (!putRes.ok) throw new LinkedInApiError(`LinkedIn image upload failed (${putRes.status})`);

  return asset;
}

export async function publishToLinkedIn(params: LinkedInPublishParams): Promise<LinkedInPublishResult> {
  const asset = await uploadImageToLinkedIn(params.personUrn, params.accessToken, params.imageUrl);

  const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: params.personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: params.text },
          shareMediaCategory: 'IMAGE',
          media: [{ status: 'READY', media: asset }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new LinkedInApiError(json?.message || 'LinkedIn post creation failed', json);

  // LinkedIn returns the post id in the x-restli-id response header on ugcPosts creation
  const postId = res.headers.get('x-restli-id') || json.id || 'unknown';
  return { postId };
}

export { LINKEDIN_REST_BASE };
