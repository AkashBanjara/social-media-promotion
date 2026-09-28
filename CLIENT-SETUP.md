# Setup Guide

This panel posts to your Instagram, Facebook Page, and LinkedIn from one place.

Before it can do that, you need to create a few free developer accounts and send
us some values. Nothing here costs money. Set aside about 45 minutes.

You will NOT be asked for any social media password at any point. If something
asks you for one, stop and check with us.

---

## What you need before starting

- [ ] A **Facebook Page** for your business (a personal profile will not work)
- [ ] An **Instagram Professional account** (Business or Creator), linked to that Page
- [ ] A **Google account** — this is how you will log in to the panel
- [ ] A **LinkedIn Company Page** (only if you want LinkedIn posting)

If you don't have the Facebook Page or Instagram Professional account yet, do
Part 1 first — everything else depends on it.

---

## Part 1 — Facebook Page + Instagram

### 1.1 Create a Facebook Page

Go to <https://www.facebook.com/pages/create>, enter your business name, pick a
category, and create it. Takes two minutes.

### 1.2 Switch Instagram to a Professional account

In the Instagram app:

1. Profile → ☰ menu → **Settings and privacy**
2. Scroll to **Account type and tools**
3. **Switch to professional account**
4. Pick a category, then choose **Business** (not Creator)

This is free and instant. Your account must be **public** — the posting API does
not work on private accounts.

### 1.3 Link Instagram to the Facebook Page

This step is the one people miss, and without it Instagram posting will not work.

In the Instagram app: Profile → **Edit profile** → **Page** → select your
Facebook Page.

To confirm it worked, open your Facebook Page → Settings → **Linked accounts** →
Instagram. Your Instagram username should be listed there.

---

## Part 2 — Meta app (for Facebook + Instagram posting)

This creates the connection between the panel and your accounts. You will be the
owner of this app.

### 2.1 Create the app

1. Go to <https://developers.facebook.com> and log in with the Facebook account
   that manages your Page
2. **My Apps** → **Create App**
3. App type: **Business**
4. Give it any name (e.g. your business name)

### 2.2 Add Facebook Login

1. In the left sidebar: **Add Product** → find **Facebook Login for Business** →
   Set up
2. Go to its **Settings**
3. Under **Valid OAuth Redirect URIs**, paste the URL we give you. It will look
   like:
   ```
   https://your-panel-address.vercel.app/api/social/callback/meta
   ```
4. **Save changes**

> Ask us for this URL before you start — it is specific to your panel.

### 2.3 Leave the app in Development mode

At the top of the page you will see **App Mode: Development**. **Leave it there.**
Do not switch it to Live.

Because you own this app, Development mode already gives you full access to your
own Pages and Instagram account. Switching to Live would trigger Meta's app
review process — weeks of waiting and business document verification, for no
benefit to you.

### 2.4 Send us two values

Go to **App settings** → **Basic** and copy:

- **App ID**
- **App Secret** (click "Show")

Send both to us. See the security note at the bottom of this page first.

---

## Part 3 — LinkedIn app (skip if you don't want LinkedIn)

1. Go to <https://www.linkedin.com/developers/apps> → **Create app**
2. You must attach a **LinkedIn Company Page** — create one first if you don't
   have it. You also need to upload a logo.
3. Open the **Products** tab and request both of these (they are approved
   instantly, no review):
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn**
4. Open the **Auth** tab → under **Authorized redirect URLs**, add the LinkedIn
   URL we give you:
   ```
   https://your-panel-address.vercel.app/api/social/callback/linkedin
   ```
5. From the same Auth tab, send us the **Client ID** and **Primary Client Secret**

---

## Part 4 — Tell us your Google login email

The panel allows exactly one Google account to log in — yours. Send us the Gmail
address you want to use.

Anyone else who tries to log in is rejected, even if they have the link.

---

## What to send us

| Item | Where you found it |
|---|---|
| Meta **App ID** | Meta app → App settings → Basic |
| Meta **App Secret** | same page, click "Show" |
| LinkedIn **Client ID** | LinkedIn app → Auth tab |
| LinkedIn **Primary Client Secret** | same tab |
| Your **Google email** | the account you'll log in with |

### Please send these securely

These secrets let software post as your business. Don't send them over WhatsApp,
SMS, or plain email — those keep copies you can't delete.

Use a one-time secret link instead: paste each value at
<https://onetimesecret.com>, and send us the link it generates. The link dies
after it is opened once.

If any of these values leak, you can regenerate them: Meta app → Basic → next to
App Secret, and LinkedIn app → Auth tab.

---

## Once you send those

We configure and deploy your panel, then send you the link. You log in with your
Google account, go to **Social Accounts**, and click Connect on each platform.

Facebook will show you a permissions screen listing things like "Create and
manage content on your Page". Choose **Edit settings** rather than Continue, make
sure your Page is selected and all permissions are on, then Save.

After that you're done — go to **Create Post**, upload an image, write a caption,
pick your platforms, and publish.

---

## Things worth knowing

**You can revoke access at any time.** Facebook → Settings → Business
Integrations. LinkedIn → Settings → Data privacy → Permitted services. The panel
loses access immediately.

**Facebook Pages only, not personal profiles.** Meta does not allow apps to post
to personal profiles. This is their rule, not a limitation of the panel.

**Instagram needs the Page link to stay in place.** If you ever unlink Instagram
from your Facebook Page, Instagram posting stops working until you reconnect.

**Your access tokens are stored encrypted**, but they live on the server that
runs your panel. Whoever operates that server can technically post as your
accounts. Make sure you're comfortable with who that is — and that it's written
down somewhere, not just understood.
