/*
  =====================================================================
  DISCORD LOGIN — "implicit grant" OAuth2 flow.

  This works entirely in the browser, with no backend, which is why it
  works on GitHub Pages. It uses Discord's "identify" scope only, so it
  can read the logged-in user's username/avatar/id — nothing else (no
  email, no server list, no ability to act as the user).

  SETUP (see README for full walkthrough):
  1. Create an application at https://discord.com/developers/applications
  2. OAuth2 -> General -> add a Redirect URI pointing at your deployed
     site (e.g. https://yourusername.github.io/your-repo/apply.html —
     see note in config.js about needing one redirect per page you
     want login on, OR redirecting everything through one page).
  3. Copy the "Client ID" into js/config.js as discordClientId.

  SECURITY NOTE ON THE IMPLICIT FLOW:
  The access token appears in the URL fragment (after #) when Discord
  redirects back. Fragments are never sent to any server (browsers
  strip them from requests), so this doesn't leak the token to your
  GitHub Pages host or any CDN logs — but anyone looking over the
  user's shoulder at that exact moment, or a malicious browser
  extension, could read it. This is a normal, accepted trade-off for
  public static-site clients; Discord officially supports this flow
  for this exact use case.
  =====================================================================
*/

const DISCORD_TOKEN_KEY = 'wrp_discord_token';

function getStoredToken() {
  try {
    const raw = sessionStorage.getItem(DISCORD_TOKEN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expires_at && Date.now() > data.expires_at) {
      sessionStorage.removeItem(DISCORD_TOKEN_KEY);
      return null;
    }
    return data.access_token;
  } catch (e) {
    return null;
  }
}

function storeToken(accessToken, expiresInSeconds) {
  const data = {
    access_token: accessToken,
    expires_at: Date.now() + (parseInt(expiresInSeconds || '3600', 10) * 1000)
  };
  sessionStorage.setItem(DISCORD_TOKEN_KEY, JSON.stringify(data));
}

function clearToken() {
  sessionStorage.removeItem(DISCORD_TOKEN_KEY);
}

function buildDiscordAuthUrl() {
  const redirectUri = SITE_CONFIG.discordRedirectUri || (window.location.origin + window.location.pathname);
  const returnTo = window.location.pathname + window.location.search;
  const params = new URLSearchParams({
    client_id: SITE_CONFIG.discordClientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'identify',
    state: returnTo
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function fetchDiscordUser(token) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch Discord user (token may be expired/revoked)');
  return res.json();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function avatarUrlFor(user) {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=64`;
  }
  // Default Discord avatar fallback
  const idx = user.discriminator && user.discriminator !== '0'
    ? parseInt(user.discriminator, 10) % 5
    : Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function renderAuthUI(user) {
  const area = document.getElementById('authArea');
  if (!area) return;

  if (user) {
    area.innerHTML = `
      <div class="user-chip">
        <img class="av-img" src="${avatarUrlFor(user)}" alt="">
        ${escapeHtml(user.username)}
      </div>
      <button class="create-chip" id="discordLogoutBtn" type="button">Log out</button>
    `;
    const logoutBtn = document.getElementById('discordLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearToken();
        renderAuthUI(null);
        document.dispatchEvent(new CustomEvent('wrp:discord-logout'));
      });
    }
    document.dispatchEvent(new CustomEvent('wrp:discord-user', { detail: { user } }));
  } else {
    const configured = SITE_CONFIG.discordClientId && !SITE_CONFIG.discordClientId.includes('PASTE_YOUR');
    area.innerHTML = configured
      ? `<a class="nav-cta" href="${buildDiscordAuthUrl()}">Log in with Discord</a>`
      : `<span class="user-chip" title="Add a Discord Client ID in js/config.js to enable login"><span class="av">!</span> Login not configured</span>`;
  }
}

(async function initDiscordAuth() {
  // If Discord just redirected back here, the token is in the URL fragment.
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');
    const state = hashParams.get('state');

    if (token) {
      storeToken(token, expiresIn);
      // Strip the token out of the visible URL so it isn't bookmarked/shared.
      history.replaceState(null, '', window.location.pathname + window.location.search);

      // If login was started from a different page, bounce back there now.
      // The token is already in sessionStorage, so the next page picks it up.
      const currentPath = window.location.pathname + window.location.search;
      if (state && state !== currentPath) {
        window.location.replace(state);
        return;
      }
    }
  }

  const token = getStoredToken();
  if (!token) {
    renderAuthUI(null);
    return;
  }

  try {
    const user = await fetchDiscordUser(token);
    window.WRP_DISCORD_USER = user; // available to apply.js etc. for autofill
    renderAuthUI(user);
  } catch (err) {
    clearToken();
    renderAuthUI(null);
  }
})();
