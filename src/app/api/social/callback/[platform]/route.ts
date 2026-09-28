import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SocialAccount, setAccessToken } from '@/models/SocialAccount';
import { exchangeMetaCodeForToken, getLongLivedToken, listManagedPages, getInstagramAccountInfo, MetaApiError } from '@/lib/social/meta';
import { exchangeLinkedInCode, getLinkedInProfile, LinkedInApiError } from '@/lib/social/linkedin';

/**
 * Meta omits `expires_in` when the token it hands back never expires (e.g. when
 * exchanging a token that is already long-lived). Treat that as "no expiry"
 * rather than building `new Date(NaN)`, which fails Mongoose date validation.
 */
function expiryDate(expiresIn?: number): Date | null {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
}

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL('/login', req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = req.cookies.get('oauth_state')?.value;
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(new URL(`/social-accounts?error=${encodeURIComponent(errorParam)}`, req.url));
  }
  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL('/social-accounts?error=invalid_state', req.url));
  }

  await connectDB();
  const userId = session.user.email;

  try {
    if (params.platform === 'meta') {
      const { accessToken: shortLived } = await exchangeMetaCodeForToken(code);
      const { accessToken: longLived, expiresIn } = await getLongLivedToken(shortLived);
      const pages = await listManagedPages(longLived);

      if (!pages.length) {
        return NextResponse.redirect(new URL('/social-accounts?error=no_pages_found', req.url));
      }

      // Single-user panel: use the first Page the account manages as "the" Page.
      const page = pages[0];
      if (!page) {
        return NextResponse.redirect(new URL('/social-accounts?error=no_pages_found', req.url));
      }
      const expiresAt = expiryDate(expiresIn);

      let fbAccount = await SocialAccount.findOne({ userId, platform: 'facebook' }).select('+accessTokenEncrypted');
      if (!fbAccount) fbAccount = new SocialAccount({ userId, platform: 'facebook' });
      setAccessToken(fbAccount, page.access_token);
      fbAccount.accountId = page.id;
      fbAccount.accountName = page.name;
      fbAccount.status = 'connected';
      fbAccount.expiresAt = expiresAt;
      fbAccount.metadata = { pageId: page.id };
      await fbAccount.save();

      if (page.instagram_business_account) {
        const igInfo = await getInstagramAccountInfo(page.instagram_business_account.id, page.access_token);
        let igAccount = await SocialAccount.findOne({ userId, platform: 'instagram' }).select('+accessTokenEncrypted');
        if (!igAccount) igAccount = new SocialAccount({ userId, platform: 'instagram' });
        // IG publishing uses the Page's access token, not a separate IG token.
        setAccessToken(igAccount, page.access_token);
        igAccount.accountId = igInfo.id;
        igAccount.accountName = `@${igInfo.username}`;
        igAccount.status = 'connected';
        igAccount.expiresAt = expiresAt;
        igAccount.metadata = { pageId: page.id, profilePictureUrl: igInfo.profile_picture_url };
        await igAccount.save();
      }

      const response = NextResponse.redirect(new URL('/social-accounts?connected=meta', req.url));
      response.cookies.delete('oauth_state');
      return response;
    }

    if (params.platform === 'linkedin') {
      const { accessToken, expiresIn } = await exchangeLinkedInCode(code);
      const profile = await getLinkedInProfile(accessToken);

      let account = await SocialAccount.findOne({ userId, platform: 'linkedin' }).select('+accessTokenEncrypted');
      if (!account) account = new SocialAccount({ userId, platform: 'linkedin' });
      setAccessToken(account, accessToken);
      account.accountId = `urn:li:person:${profile.sub}`;
      account.accountName = profile.name;
      account.status = 'connected';
      account.expiresAt = expiryDate(expiresIn);
      account.metadata = {};
      await account.save();

      const response = NextResponse.redirect(new URL('/social-accounts?connected=linkedin', req.url));
      response.cookies.delete('oauth_state');
      return response;
    }

    return NextResponse.redirect(new URL('/social-accounts?error=unknown_platform', req.url));
  } catch (err) {
    const message =
      err instanceof MetaApiError || err instanceof LinkedInApiError
        ? err.message
        : process.env.NODE_ENV === 'production'
          ? 'Connection failed. Please try again.'
          : // dev only: surface the real cause instead of swallowing it
            `${(err as Error)?.name}: ${(err as Error)?.message}`;
    console.error('[social:callback]', err);
    return NextResponse.redirect(new URL(`/social-accounts?error=${encodeURIComponent(message)}`, req.url));
  }
}
