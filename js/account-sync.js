// Bridges the Discord login (js/auth.js) to Firebase (js/firebase-app.js).
// Loaded as a module on every page so member records and stats stay in sync.
import { recordMember, getMemberStats, isFirebaseReady } from './firebase-app.js';

document.addEventListener('wrp:discord-user', async (e) => {
  try {
    await recordMember(e.detail.user);
  } catch (err) {
    console.error('Could not record member in Firebase:', err);
  }
  refreshMemberStatsWidget();
});

async function refreshMemberStatsWidget() {
  const totalEl = document.getElementById('statTotalMembers');
  const newestEl = document.getElementById('statNewestMember');
  if (!totalEl && !newestEl) return; // widget not on this page

  if (!isFirebaseReady()) {
    if (totalEl) totalEl.textContent = 'Not connected';
    if (newestEl) newestEl.innerHTML = '<span class="tag">Firebase not configured</span>';
    return;
  }

  try {
    const stats = await getMemberStats();
    if (totalEl) totalEl.textContent = stats.totalMembers.toLocaleString();
    if (newestEl) {
      if (stats.newestMember) {
        newestEl.innerHTML = `<span class="tag">Newest Member</span><br>${escapeHtml(stats.newestMember.username)}`;
      } else {
        newestEl.innerHTML = `<span class="tag">Newest Member</span><br>Nobody yet — be the first to log in!`;
      }
    }
  } catch (err) {
    console.error('Could not load member stats:', err);
    if (totalEl) totalEl.textContent = '—';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', refreshMemberStatsWidget);
// In case DOMContentLoaded already fired before this module finished loading:
if (document.readyState !== 'loading') refreshMemberStatsWidget();
