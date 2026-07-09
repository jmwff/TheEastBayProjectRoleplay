import { listPhotos, uploadPhoto, isFirebaseReady, isCloudinaryReady } from './firebase-app.js';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  if (!isFirebaseReady()) {
    grid.innerHTML = '<div class="empty-note">Gallery storage isn\'t connected yet — add your Firebase config in js/config.js.</div>';
    return;
  }

  try {
    const photos = await listPhotos();
    if (photos.length === 0) {
      grid.innerHTML = '<div class="empty-note">No photos yet — be the first to upload one above!</div>';
      return;
    }
    grid.innerHTML = photos.map(p => `
      <div class="gallery-item">
        <img src="${p.url}" alt="${escapeHtml(p.caption || 'Community photo')}" style="aspect-ratio:4/3; width:100%; object-fit:cover; display:block;">
        <div class="gallery-caption">
          <span class="title">${escapeHtml(p.caption || 'Untitled')}</span>
          <span class="by">By ${escapeHtml(p.uploaderUsername || 'Unknown')}${p.uploadedAt ? ' · ' + timeAgo(p.uploadedAt.toDate()) : ''}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="empty-note">Could not load the gallery right now.</div>';
  }
}

function setUpUploadForm() {
  const loggedOutMsg = document.getElementById('uploadLoggedOut');
  const form = document.getElementById('uploadForm');
  const status = document.getElementById('uploadStatus');
  const loginLink = document.getElementById('galleryLoginLink');
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      const chip = document.querySelector('#authArea .nav-cta');
      if (chip) chip.click();
      else alert('Use the "Log in with Discord" button in the top bar.');
    });
  }

  function showLoggedIn(user) {
    loggedOutMsg.style.display = 'none';
    form.style.display = '';
  }

  document.addEventListener('wrp:discord-user', (e) => showLoggedIn(e.detail.user));
  document.addEventListener('wrp:discord-logout', () => {
    form.style.display = 'none';
    loggedOutMsg.style.display = '';
  });
  if (window.WRP_DISCORD_USER) showLoggedIn(window.WRP_DISCORD_USER);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fPhoto');
    const captionInput = document.getElementById('fCaption');
    const btn = document.getElementById('uploadBtn');
    const file = fileInput.files[0];

    if (!file) return;

    btn.disabled = true;
    btn.textContent = 'Uploading…';
    status.className = 'form-status';

    if (!isCloudinaryReady()) {
      status.textContent = 'Photo storage isn\'t connected yet. Add your Cloudinary details in js/config.js.';
      status.className = 'form-status show error';
      btn.disabled = false;
      btn.textContent = 'Upload Photo';
      return;
    }

    try {
      await uploadPhoto(file, captionInput.value.trim(), window.WRP_DISCORD_USER);
      status.textContent = 'Photo uploaded!';
      status.className = 'form-status show success';
      form.reset();
      renderGallery();
    } catch (err) {
      status.textContent = err.message || 'Upload failed. Try again.';
      status.className = 'form-status show error';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Upload Photo';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  setUpUploadForm();
});
if (document.readyState !== 'loading') {
  renderGallery();
  setUpUploadForm();
}
