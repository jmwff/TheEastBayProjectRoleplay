/*
  =====================================================================
  SITE CONFIG — the only file you need to edit to make the site
  "yours": server name, Discord invite, login, and one webhook URL per
  department application.

  HOW TO GET A DISCORD WEBHOOK URL:
  1. Open Discord, go to the channel you want applications posted into
     (e.g. #new-applications).
  2. Channel Settings -> Integrations -> Webhooks -> New Webhook.
  3. Name it, copy the "Webhook URL", paste it below.
  4. Repeat per department if you want different channels, or reuse
     the same URL everywhere.

  Note: a webhook URL can only be used to POST messages into that one
  channel (not read messages or anything else) — but anyone who has
  the URL can spam that channel. If your repo is public, treat the
  URL as visible to anyone. See README for options.

  HOW TO SET UP "LOG IN WITH DISCORD":
  1. Go to https://discord.com/developers/applications and create a
     new application.
  2. Under OAuth2 -> General, click "Add Redirect" and enter the exact
     URL of your deployed site's homepage, e.g.
     https://yourusername.github.io/your-repo-name/
     (must match exactly, including trailing slash, or login will fail).
  3. Copy the "Client ID" (NOT the client secret — this flow never
     needs the secret) into discordClientId below.
  4. Set discordRedirectUri below to that same exact URL.
  See README for more detail on how this login works with no backend.

  HOW TO SET UP REAL ACCOUNTS (Firebase Firestore — no credit card needed):
  1. Go to https://console.firebase.google.com, create a free project.
  2. Build -> Firestore Database -> Create database (start in "test mode"
     for now, you'll paste locked-down rules from the README after).
  3. Project settings (gear icon) -> General -> scroll to "Your apps" ->
     click the </> (web) icon -> register an app (nickname can be
     anything) -> copy the firebaseConfig object it gives you into
     firebaseConfig below.
  4. Paste the security rules from the README into Firestore's Rules
     tab and click Publish.
  Note: this project intentionally does NOT use Firebase Storage for
  photos, because as of 2026 Firebase requires linking a credit card
  (their "Blaze" plan) to use Storage, even for free-tier usage. Photo
  files are instead stored with Cloudinary (below), which has a real
  free-forever tier with no card required.

  HOW TO SET UP PHOTO UPLOADS (Cloudinary — no credit card needed):
  1. Go to https://cloudinary.com and sign up for the free plan (no
     card required — you can sign up with Google/GitHub/email).
  2. On your Cloudinary dashboard, copy your "Cloud Name" into
     cloudinary.cloudName below.
  3. Go to Settings (gear icon) -> Upload -> scroll to "Upload presets"
     -> click "Add upload preset". Set Signing Mode to "Unsigned",
     save, and copy the preset name into cloudinary.uploadPreset below.
  See README for the full walkthrough and the security trade-offs.
  =====================================================================
*/

const SITE_CONFIG = {
  serverName: "The East Bay Project Roleplay",
  discordInviteUrl: "https://discord.gg/your-invite-code",

  // Discord OAuth (for "Log in with Discord")
  discordClientId: "1518715513302417488",
  discordRedirectUri: "https://jmwff.github.io/TheEastBayProjectRoleplay/",

  // Firebase Firestore only (for recording member accounts + photo
  // metadata) — paste the firebaseConfig object Firebase gives you
  // when you register a web app. No credit card needed for this part.
  firebaseConfig: {
    apiKey: "AIzaSyDCziwcR1xTrOeU2kieGIYbPvxuuAudkro",
    authDomain: "the-east-bay-project-roleplay.firebaseapp.com",
    projectId: "the-east-bay-project-roleplay",
    storageBucket: "the-east-bay-project-roleplay.firebasestorage.app",
    messagingSenderId: "111213832731",
    appId: "1:111213832731:web:d92ca08b154127054e26be",
  },

  // Cloudinary (for the actual photo files — no credit card needed)
  cloudinary: {
    cloudName: "wh1jy8ao",
    uploadPreset: "ebrpwebsite"
  },

  defaultWebhookUrl: "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",

  departmentWebhooks: {
    civilian: "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",
    standard: "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",
    leo:      "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",
    developer:"PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE",
    media:    "PASTE_YOUR_DISCORD_WEBHOOK_URL_HERE"
  }
};
