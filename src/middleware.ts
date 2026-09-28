import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    secret: process.env.AUTH_SECRET,
    callbacks: {
      // authorized() only checks "is there a valid token" — the harder check
      // (is it the ONE authorized email) already happened in the signIn callback,
      // so a valid token here already implies it's the right person. We re-check
      // anyway as defense in depth in case token issuance logic ever changes.
      authorized: ({ token }) => {
        if (!token?.email) return false;
        const authorizedEmail = process.env.AUTHORIZED_EMAIL?.toLowerCase().trim();
        return !!authorizedEmail && token.email.toLowerCase().trim() === authorizedEmail;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create-post/:path*',
    '/post-history/:path*',
    '/social-accounts/:path*',
    '/email/:path*',
    '/settings/:path*',
    '/api/posts/:path*',
    '/api/social/:path*',
    '/api/contacts/:path*',
    '/api/campaigns/:path*',
    '/api/smtp/:path*',
    '/api/settings/:path*',
    '/api/upload/:path*',
    '/api/dashboard/:path*',
  ],
};
