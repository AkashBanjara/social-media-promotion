/**
 * Shared Meta (Facebook + Instagram) Graph API integration.
 *
 * Isolated here so that when Meta changes API versions/permissions, only this
 * file (and instagram.ts / facebook.ts, which depend on it) needs updating.
 *
 * Required Meta app permissions (current as of Graph API v20.0 — verify against
 * https://developers.facebook.com/docs/permissions/reference before going live,
 * since Meta revises required scopes periodically):
 *   - pages_show_list
 *   - pages_read_engagement
 *   - pages_manage_posts
 *   - instagram_basic
 *   - instagram_content_publish
 *   - business_management (often required to list Pages for the app)
 *
 * The IG account must be a Professional (Business/Creator) account linked to
 * a Facebook Page (spec §9).
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaApiError extends Error {
  constructor(message: string, public raw?: unknown) {
    super(message);
    this.name = 'MetaApiError';
  }
}

async function metaFetch<T>(path: string, params: Record<string, string> = {}, method: 'GET' | 'POST' | 'DELETE' = 'GET'): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  if (method === 'GET') {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    ...(method !== 'GET' && {
      body: new URLSearchParams(params),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    const message = json?.error?.message || `Meta API request failed (${res.status})`;
    throw new MetaApiError(message, json?.error);
  }

  return json as T;
}

export function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID as string,
    redirect_uri: process.env.META_REDIRECT_URI as string,
    state,
    scope: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'business_management',
    ].join(','),
    response_type: 'code',
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const json = await metaFetch<{ access_token: string; expires_in: number }>('/oauth/access_token', {
    client_id: process.env.META_APP_ID as string,
    client_secret: process.env.META_APP_SECRET as string,
    redirect_uri: process.env.META_REDIRECT_URI as string,
    code,
  });
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

/**
 * Short-lived user tokens must be exchanged for a long-lived token (~60 days).
 * `expiresIn` is absent when Meta returns a token that does not expire.
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
  const json = await metaFetch<{ access_token: string; expires_in?: number }>('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID as string,
    client_secret: process.env.META_APP_SECRET as string,
    fb_exchange_token: shortLivedToken,
  });
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string; // page-scoped token, used for FB + IG publishing
  instagram_business_account?: { id: string };
}

/** Lists the Pages the authorized user manages, including linked IG business account IDs. */
export async function listManagedPages(userAccessToken: string): Promise<MetaPage[]> {
  const json = await metaFetch<{ data: MetaPage[] }>('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token,instagram_business_account',
  });
  return json.data;
}

export async function getInstagramAccountInfo(igUserId: string, pageAccessToken: string) {
  return metaFetch<{ id: string; username: string; profile_picture_url?: string }>(`/${igUserId}`, {
    access_token: pageAccessToken,
    fields: 'id,username,profile_picture_url',
  });
}

export { metaFetch, GRAPH_BASE };
