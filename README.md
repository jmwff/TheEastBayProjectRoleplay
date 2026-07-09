# The East Bay Project Roleplay — Community Website

A static recreation of a forum-community-style FiveM website (Home / Forums / Open Applications / Departments / Resources), built to deploy free on **GitHub Pages**. No build step — just HTML, CSS, and vanilla JS. Real member records live in Firebase Firestore; real photo uploads live in Cloudinary — both genuinely free, no credit card required for either.

## What's in the box

```
.
├── index.html            Home page — real member stats via Firebase
├── forums.html           Forums listing (category/sub-forum look, layout only)
├── applications.html     Open Applications list
├── apply.html            The actual working application form (Discord webhook)
├── staff.html            Staff roster
├── rules.html            Rules & Regulations
├── requirements.html     Community Requirements / recruitment cycle
├── gallery.html          Real photo gallery — upload + browse (Firebase Storage)
├── css/style.css         All styling
└── js/
    ├── config.js         <-- EDIT THIS: server name, Discord invite/OAuth, Firebase config, webhook URLs
    ├── nav.js             Mobile menu + dropdown menus (every page)
    ├── auth.js            Discord login (OAuth implicit grant, no backend)
    ├── firebase-app.js    Firebase helpers: record members, list/upload photos, stats
    ├── account-sync.js    Bridges Discord login -> Firebase member record + stats widget
    ├── gallery.js         Gallery page: renders real photos, handles uploads
    └── apply.js           Department data + Discord submission (apply.html only)
```

## Important: what's real vs. what's a visual recreation

This was built to visually match a real Invision Community forum theme, then had real functionality wired in piece by piece. Current state:

- **Discord login is real.** Once configured, the top bar shows the actual logged-in user's Discord username and avatar, not a placeholder.
- **Member accounts are really recorded.** Every login writes/updates a real record in Firebase, and the homepage's "Total Members" and "Newest Member" are live counts from that data — not hardcoded numbers.
- **Photo uploads are real.** The Gallery page lets logged-in users upload an actual image to real cloud storage, and it shows up in the grid for everyone who visits — no placeholder tiles left.
- **Applications are real.** Clicking "Apply" takes you to `apply.html`, pre-selects the right department, and — once you add a Discord webhook — actually submits the application as a message in your Discord.
- **The Forums page is still layout-only.** The categories/rows are real markup but there's no actual thread creation or replying behind them — that would require real forum software (Invision Community itself, or a free alternative like NodeBB/Discourse) or a much larger custom backend. Happy to help with that separately if you want real forum threads.

## 1. Deploy to GitHub Pages

1. Create a new GitHub repository and upload everything in this folder, keeping the folder structure (`css/`, `js/`, and all `.html` files at the root).
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. GitHub gives you a live URL like `https://yourusername.github.io/your-repo-name/` within a minute or two.

Optional custom domain: add a `CNAME` file at the repo root containing just your domain, then follow [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## 2. Set up "Log in with Discord"

Login works with **no backend**, using Discord's OAuth2 "implicit grant" flow — Discord redirects the user back with an access token straight in the URL, the browser uses it to ask Discord "who is this," and shows their username + avatar. This is why it works on a static host like GitHub Pages.

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) and create a new application (any name — this is just for the login button, separate from your bot if you have one).
2. Under **OAuth2 → General**, click **Add Redirect** and enter the exact URL of your deployed homepage, e.g. `https://yourusername.github.io/your-repo-name/` — it must match **exactly** (including trailing slash) or login will silently fail.
3. Copy the **Client ID** shown near the top of that page (not the Client Secret — this flow never needs it, and you should never put a client secret in a public static site).
4. Open `js/config.js` and set:
   ```js
   discordClientId: "your-client-id-here",
   discordRedirectUri: "https://yourusername.github.io/your-repo-name/",
   ```
5. Commit and push.

Once set up, the "Guest" chip in the top bar becomes a **Log in with Discord** button. After logging in, the user's real Discord username and avatar show up there, and their Discord username auto-fills into the application form. Logging out just clears the browser session — it doesn't touch their Discord account.

**What this is (and isn't):** this proves *who the person's Discord account is*, which is enough for confirming your applicants are real Discord users — but it isn't a full membership system. It won't gate specific pages, remember roles from your Discord server, or persist across devices/browsers (login is per-browser-session). If you eventually want role-gating (e.g. "only show LEO applications to people with the Recruit role in Discord"), that requires a small backend to safely check server membership — happy to help build that if you get there.

## 3. Set up real accounts + photo uploads (no credit card needed)

Logging in with Discord (above) only proves who someone is *for that page load* — it doesn't remember them, and there's nowhere for uploaded photos to live. Both of those need a real database. This uses two free services together:

- **Firebase Firestore** — stores member records and photo captions/metadata. Free, no card required.
- **Cloudinary** — stores the actual photo files. Free, no card required.

You'll notice this *isn't* just "Firebase" for everything. That's on purpose: **Firebase Storage now requires linking a credit card** (Google's pay-as-you-go "Blaze" plan) even to use it for free — that changed in 2026. Actual usage still costs $0 if you stay under the free quota, but you have to hand over a card to get there, and I didn't want to spring that on you after the fact. Cloudinary's free tier genuinely requires nothing — no card, ever, for the free tier — so photo files live there instead, while Firestore (which was never affected by that change) still handles the lightweight account/member data.

**What you get:** every Discord login is recorded as a real member (real join date, real Discord avatar/username), the homepage's "Total Members" and "Newest Member" are real counts pulled from that data, and the Gallery page has a working upload form — logged-in users pick a photo, it uploads for real, and it shows up in the grid for everyone.

### Setup part 1: Firestore (member records)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a free project.
2. In the left sidebar: **Build → Firestore Database → Create database**. Choose a location close to your players, start in **test mode** for now (you'll lock it down with the rules below in a minute). You do **not** need to touch Storage anywhere in this project.
3. Click the gear icon → **Project settings** → scroll to "Your apps" → click the **`</>`** (web) icon → register an app (any nickname) → it'll show you a `firebaseConfig` object. Copy the whole thing into `js/config.js`:
   ```js
   firebaseConfig: {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   },
   ```
4. Back in Firebase, go to **Firestore Database → Rules** tab, replace the contents with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /members/{memberId} {
         allow read: if true;
         allow write: if request.resource.data.discordId == memberId;
       }
       match /photos/{photoId} {
         allow read: if true;
         allow create: if request.resource.data.caption is string
           && request.resource.data.caption.size() < 300
           && request.resource.data.url is string;
         allow update, delete: if false;
       }
     }
   }
   ```
   Click **Publish**.

### Setup part 2: Cloudinary (photo files)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for the free plan — with Google, GitHub, or email, no card asked for anywhere in the flow.
2. Your dashboard shows a **Cloud Name** near the top — copy it into `cloudinary.cloudName` in `js/config.js`.
3. Go to **Settings** (gear icon) → **Upload** → scroll to "Upload presets" → **Add upload preset**. Set **Signing Mode** to **Unsigned** (this is what allows the browser to upload directly with no backend/API secret involved), save, and copy the preset name into `cloudinary.uploadPreset`.
4. Commit and push your updated `js/config.js`.

### The security trade-off, explained plainly

Firestore's rules can check things like "does this document have the right shape" or "is this caption under 300 characters" — but they can't verify **who** is writing, because that check normally relies on Firebase's own login system, and this site uses Discord's login instead. Cloudinary's unsigned upload preset has a similar gap — anyone with your cloud name and preset name (both visible in your public site's source code) could technically upload files directly to your account, bypassing the site entirely. In practice this means: the setup above stops obviously-wrong writes, but can't stop a determined person from spamming uploads or writing a fake member record without ever touching your site's UI or logging in with Discord for real.

This is the same category of trade-off as the Discord webhook used for applications — fine for a hobby/community project, not something to build a bank on. If you want it properly locked down later (writes cryptographically tied to a real, verified Discord login, and upload limits enforced server-side), that requires adding one small serverless function — happy to build that when you're ready for it.

## 4. Make applications actually submit to Discord

1. In Discord, open the channel you want applications posted into.
2. **Channel Settings → Integrations → Webhooks → New Webhook** → copy the Webhook URL.
3. Open `js/config.js` and paste it into `defaultWebhookUrl`, or fill in `departmentWebhooks` to route each department to a different channel.
4. Update `discordInviteUrl` in the same file with your server's real invite link.
5. Commit and push — your live site updates automatically.

**Public repo note:** a webhook URL only allows posting into that one channel (nothing else), but anyone who sees it in your public repo could spam that channel. If that's a concern, keep the repo private, or ask about routing submissions through a small serverless proxy instead so the URL never appears in the repo.

## 5. Customize content

- **Departments/applications list** — edit the rows in `applications.html`, and the matching entries in the `deptData` object in `js/apply.js` (position lists, prompts, scenario questions).
- **Departments/Resources dropdown menus** — edit the `.mega` blocks in the nav (repeated at the top of every page).
- **Staff roster** — `staff.html`.
- **Rules / requirements copy** — `rules.html` and `requirements.html`.
- **Gallery images** — currently placeholder tiles in `gallery.html`; swap in real `<img>` tags pointing at photos you upload into the repo.

## Browser support

Uses modern CSS (`color-mix()`, CSS custom properties, `aspect-ratio`) — works in current Chrome, Firefox, Edge, and Safari.

## License

Do whatever you want with this — it's your site.
