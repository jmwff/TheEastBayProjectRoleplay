// Shared across all pages: mobile menu toggle + dropdown mega-menus.
document.addEventListener('DOMContentLoaded', () => {
  // Wire up Discord invite links from config.js, if present
  if (typeof SITE_CONFIG !== 'undefined') {
    document.querySelectorAll('[data-discord-link]').forEach(el => {
      el.href = SITE_CONFIG.discordInviteUrl;
    });
  }

  const menuBtn = document.getElementById('menuBtn');
  const mainNav = document.getElementById('mainNav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
  }

  // Dropdown toggles (Departments, Resources)
  document.querySelectorAll('.nav-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = btn.closest('li');
      const wasOpen = li.classList.contains('open');
      document.querySelectorAll('.main-nav > li.open').forEach(l => l.classList.remove('open'));
      if (!wasOpen) li.classList.add('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.main-nav > li.open').forEach(l => l.classList.remove('open'));
  });

  // Close mobile nav when a plain link is clicked
  document.querySelectorAll('.main-nav > li > a').forEach(a => {
    a.addEventListener('click', () => mainNav && mainNav.classList.remove('open'));
  });

  // Sidebar tab widget (Popular Contributors: Week/Month/Year/All Time)
  document.querySelectorAll('.tab-row').forEach(row => {
    row.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
});
