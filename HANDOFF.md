

Handoff · MD
# Handoff Notes — Marketing Automation Panel
 
Context from a prior Claude.ai chat session where this Next.js project was built
from scratch and then debugged locally on Windows. Claude Code: read this first,
then explore the codebase (README.md has full setup instructions) before making
changes.
 
## Status as of handoff
 
- Full project scaffolded: Next.js 14 App Router, TypeScript, MongoDB/Mongoose,
  NextAuth (Google OAuth, single authorized email), Cloudinary, Meta Graph API
  (Instagram + Facebook), LinkedIn API, Nodemailer/SMTP.
- `npm run build`, `npx tsc --noEmit`, and `npx eslint` all passed clean in the
  original sandbox before handoff.
- Locally on the user's machine: Google sign-in is now working (reaches the
  dashboard). The user has NOT confirmed MongoDB Atlas / Cloudinary / Meta /
  LinkedIn / SMTP credentials are filled in yet — status unknown, check `.env`.
## Bugs found and fixed during the debugging session (already applied locally,
## per the user manually replacing these files — verify they match):
 
1. **`src/lib/auth.ts`** — the NextAuth session cookie was unconditionally named
   `__Secure-next-auth.session-token`, but browsers reject any `__Secure-`
   prefixed cookie unless the `Secure` flag is also set — which only happened in
   production. On `localhost` (plain http), the cookie silently failed to save,
   so login appeared to succeed but no session persisted. Fixed by only using the
   `__Secure-` prefix when `NODE_ENV === 'production'`.
2. **`src/middleware.ts`** — `withAuth()` was not given an explicit `secret`, so
   it fell back to looking for `NEXTAUTH_SECRET` (NextAuth v4's default env var
   name), which doesn't exist — this project uses `AUTH_SECRET` everywhere else.
   Result: the middleware could never verify the session JWT, so every request
   to a protected route bounced back to `/login?callbackUrl=...` even after a
   successful login. Fixed by adding `secret: process.env.AUTH_SECRET` to the
   `withAuth()` options.
3. **`src/app/api/dashboard/stats/route.ts`** and **`src/app/api/posts/route.ts`**
   (GET) — had no try/catch around the DB calls, so any failure (e.g. a bad
   `MONGODB_URI`) crashed the route with no JSON body, surfacing in the browser
   as a confusing `SyntaxError: Unexpected end of JSON input` instead of a
   readable error. Wrapped both in try/catch that returns `{ error: message }`
   with a 500 status instead.
## Known open issue at handoff time
 
After fixes #1 and #2, the user got past login to the dashboard, but
`GET /api/dashboard/stats` and `GET /api/posts` were both returning 500 with an
empty body (this is what motivated fix #3). Root cause was **not yet confirmed**
— never got to see the actual terminal stack trace. Prime suspect: `MONGODB_URI`
in `.env` is still the placeholder value, or has an un-encoded special character
in the password, or the MongoDB Atlas cluster's Network Access doesn't allow the
user's current IP.
 
**First thing to do:** check the user's `.env` for `MONGODB_URI`, and/or run the
dev server and read the actual terminal error the moment `/api/dashboard/stats`
is hit — that error (not the browser console) has the real cause.
 
## Other setup still pending (per README.md), status unconfirmed
 
Cloudinary, Meta (Facebook + Instagram) app, LinkedIn app, SMTP — the user was
walked through where to get each credential but hadn't confirmed completion of
any of these before this handoff. Check `.env` for blanks before assuming any of
this works.
 


