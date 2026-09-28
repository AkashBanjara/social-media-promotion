# Marketing Automation & Social Media Publishing Panel

A private, **single-user** marketing panel built with Next.js (App Router + TypeScript).
Upload an image you finished editing in ChatGPT, write a caption, and publish it to
Instagram, Facebook, and LinkedIn at once — plus send promotional email campaigns
over SMTP. See `.env.example` for every environment variable referenced below.

---

## 1. Folder Structure

```
src/
  app/
    (dashboard)/           # Auth-guarded route group
      dashboard/            # Overview + stats
      create-post/          # Primary feature: upload -> caption -> platforms -> publish
      post-history/         # List + [id] detail with platform-wise results
      social-accounts/      # Connect/disconnect Instagram, Facebook, LinkedIn
      email/contacts/       # Contact CRUD, CSV import/export
      email/campaigns/      # List, new, [id] detail + send
      settings/              # SMTP configuration
    api/                    # All server route handlers (see §9 in the code / spec)
    login/, access-denied/, unsubscribe/   # Public pages
  components/
    ui/                     # shadcn-style primitives (Button, Card, Dialog, Table, Toast…)
    layout/                 # Sidebar, Topbar
    posts/, contacts/, dashboard/
  lib/
    auth.ts, db.ts, encryption.ts, cloudinary.ts, rate-limit.ts, validations.ts, utils.ts
    social/                 # meta.ts, instagram.ts, facebook.ts, linkedin.ts, publisher.ts, compose.ts
    email/                  # smtp.ts, campaign.ts is folded into queue.ts, templates.ts
  models/                   # Mongoose schemas
  middleware.ts             # Route protection
```

## 2. Prerequisites

- Node.js 18.18+
- A MongoDB Atlas cluster (free tier is fine)
- A Cloudinary account (free tier)
- A Google Cloud project (OAuth)
- A Meta developer app (Facebook + Instagram)
- A LinkedIn developer app
- An SMTP provider (Gmail App Password, SendGrid, Mailgun, etc.)

Install dependencies:

```bash
npm install
cp .env.example .env
```

Fill in `.env` as you complete each setup step below, then:

```bash
npm run dev
```

---

## 3. MongoDB Atlas Setup

1. Create a free cluster at https://cloud.mongodb.com.
2. Database Access → add a user with a strong password.
3. Network Access → add your IP (or `0.0.0.0/0` for early development only — restrict before production).
4. Get the connection string and set `MONGODB_URI` in `.env`, e.g.
   `mongodb+srv://user:password@cluster.mongodb.net/marketing-panel`.

No manual schema setup is needed — Mongoose creates collections/indexes on first write.

---

## 4. Cloudinary Setup

1. Sign up at https://cloudinary.com (free tier).
2. From the Dashboard, copy **Cloud Name**, **API Key**, and **API Secret** into
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Uploaded post images are stored under the `marketing-panel/posts` folder and their
public HTTPS delivery URL is what gets sent to Instagram/Facebook/LinkedIn (both Meta
and LinkedIn's publishing APIs require a publicly reachable image URL).

---

## 5. Google OAuth Setup (single-user login)

1. https://console.cloud.google.com → new project (or reuse one).
2. APIs & Services → OAuth consent screen → External, fill minimal fields, add your
   own email as a test user (keeps it in "Testing" mode, which is fine for a one-user app).
3. Credentials → Create Credentials → OAuth client ID → Web application.
4. Authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID/Secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
6. Set `AUTHORIZED_EMAIL` to the **one** Gmail address allowed to log in. Any other
   Google account is rejected in the `signIn` callback (`src/lib/auth.ts`) before a
   session is ever created.
7. Generate `AUTH_SECRET`: `openssl rand -base64 32`.

---

## 6. Meta (Facebook + Instagram) Developer Setup

1. https://developers.facebook.com → Create App → type "Business".
2. Add the **Facebook Login** and **Instagram Graph API** products.
3. App Settings → Basic: copy **App ID** / **App Secret** into `META_APP_ID` / `META_APP_SECRET`.
4. Facebook Login → Settings → Valid OAuth Redirect URIs:
   `https://yourdomain.com/api/social/callback/meta` (and the `localhost` equivalent for dev).
   This must match `META_REDIRECT_URI` exactly.
5. **Required permissions** (App Review is required to use these outside of the
   Admins/Testers you add to the app — for a single-user tool, adding yourself as an
   Admin/Tester is enough to skip App Review entirely):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
   Verify current requirements against https://developers.facebook.com/docs/permissions/reference
   since Meta revises these periodically.
6. **Instagram Professional Account requirement**: the Instagram account you want to
   publish to must be a **Business or Creator account**, and it must be linked to a
   **Facebook Page** you administer (Instagram app → Settings → linked accounts).
   Personal Instagram accounts cannot be used with the Graph API.
7. **Facebook Page requirement**: you must be an admin of a Facebook Page (not just a
   personal profile — the app never publishes to personal profiles).

Connect it from **Social Accounts → Connect** on Facebook or Instagram; both are
discovered together because the linked IG business account comes from the same Page.

---

## 7. LinkedIn Developer Setup

1. https://www.linkedin.com/developers/apps → Create app (requires an associated
   LinkedIn Page — create a free Company Page if you don't have one).
2. Products tab → request **"Share on LinkedIn"** and **"Sign In with LinkedIn using
   OpenID Connect"**. These are typically auto-approved for your own app.
3. Auth tab → copy **Client ID** / **Client Secret** into `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.
4. Add an Authorized redirect URL: `https://yourdomain.com/api/social/callback/linkedin`
   (and the localhost equivalent), matching `LINKEDIN_REDIRECT_URI`.
5. Scopes used: `openid profile email w_member_social`.

Posts are published as your personal LinkedIn member profile (`urn:li:person:{id}`),
per the current LinkedIn UGC Posts API.

---

## 8. SMTP Setup

Any standard SMTP provider works. Two common options:

- **Gmail**: enable 2-Step Verification, then create an **App Password**
  (myaccount.google.com/apppasswords). Host: `smtp.gmail.com`, Port: `587`, Secure: off (STARTTLS).
- **SendGrid / Mailgun / Brevo (free tiers available)**: use the SMTP credentials they
  issue you.

Configure it either via `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SMTP_SECURE`) or, preferably, from **Settings →
SMTP Configuration** in the app itself — the in-app config takes priority and its
password is encrypted (AES-256-GCM) before being stored in MongoDB. Use **Test SMTP
Connection** before sending a real campaign.

---

## 9. Local Development

```bash
npm install
cp .env.example .env   # fill in all values from the sections above
npm run dev
```

Visit `http://localhost:3000` → you'll be redirected to `/login` → sign in with the
Google account matching `AUTHORIZED_EMAIL`.

---

## 10. Vercel Deployment

1. Push this repo to GitHub.
2. Import it in Vercel → Framework preset: Next.js (auto-detected).
3. Add every variable from `.env.example` under Project Settings → Environment Variables.
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain.
5. Update the Google/Meta/LinkedIn redirect URIs (in their respective developer
   consoles) to point at your production domain, as noted in each section above.
6. Deploy. Vercel Hobby's free tier is sufficient for the traffic this app expects
   (single user, low volume).

---

## 11. Production Security Checklist

- [ ] `AUTH_SECRET` and `ENCRYPTION_KEY` are strong, unique, and never committed to git
- [ ] `AUTHORIZED_EMAIL` is set to the correct account before first deploy
- [ ] MongoDB Atlas Network Access is restricted (not `0.0.0.0/0`) once you know your
      deployment's egress IPs, or you're using Atlas's Vercel integration
- [ ] All OAuth redirect URIs in Google/Meta/LinkedIn consoles use `https://` in production
- [ ] Cloudinary, SMTP, Meta, and LinkedIn secrets are only ever read server-side
      (never referenced with a `NEXT_PUBLIC_` prefix)
- [ ] Verify no access tokens, passwords, or full API error payloads are ever logged
      or returned in API responses (routes in this repo sanitize errors before
      returning them to the client)
- [ ] Confirm rate limiting (`src/lib/rate-limit.ts`) covers every sensitive endpoint
      you add in the future (publish, SMTP test, campaign send, OAuth connect are
      covered out of the box)
- [ ] Rotate `META_APP_SECRET` / `LINKEDIN_CLIENT_SECRET` / SMTP password periodically
- [ ] Confirm unsubscribe links work end-to-end before sending your first real campaign

---

## 12. Known Platform / API Limitations

- **Instagram & Facebook**: Meta enforces its own publishing rate limits per app/user;
  this app surfaces API errors as-is but does not attempt to bypass them. Long-lived
  Page tokens generally last ~60 days and must be refreshed by reconnecting from
  Social Accounts before they expire.
- **LinkedIn**: `w_member_social` posts as your personal profile, not a Company Page
  (Company Page posting requires the separate, harder-to-obtain Marketing Developer
  Platform access) — this is a deliberate v1 scope choice, not an oversight.
- **X/Twitter is intentionally not implemented in v1** per the original spec — it can
  be added later as an isolated `lib/social/x.ts` module following the same pattern as
  Instagram/Facebook/LinkedIn.
- **Email queue**: campaign sends run inline within the API request (no Redis/BullMQ
  worker in v1), paced with a fixed delay between sends. This is fine for small/medium
  contact lists on Vercel's free tier but is bounded by the serverless function's max
  execution time for very large campaigns — see the comment in `src/lib/email/queue.ts`
  for the documented upgrade path.
- **Rate limiting** (`src/lib/rate-limit.ts`) is in-memory, not Redis-backed — correct
  for a single-instance, single-user deployment, but resets on cold start and would
  need a shared store if ever run multi-instance.
- **Instagram captions** have no clickable links; the website URL is included as
  plain text only, consistent with how Instagram itself renders captions.
- No scheduling, multi-account, multi-user, or analytics features are implemented —
  the architecture (see `lib/social/publisher.ts`, the `Post`/`PostPlatformResult`
  models, and the queue-shaped email API) was deliberately kept extensible for these,
  per the spec's "future-ready architecture" requirement, without building them now.

---

## 13. Scaling the Email Queue (future upgrade)

When contact lists grow large enough that inline sending becomes impractical:

1. Add Redis (Upstash's free tier works well on Vercel) and BullMQ.
2. Replace the body of `processCampaign()` in `src/lib/email/queue.ts` with a job
   enqueue call; move the current loop body into a BullMQ worker process.
3. Nothing else changes — `EmailLog` rows, the `/api/campaigns/[id]/send` route, and
   the campaign detail UI all already read/write per-recipient status the same way a
   worker would.
