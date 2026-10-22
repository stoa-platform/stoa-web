const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
const toggle = document.querySelector('[data-theme-toggle]');
const currentTheme = () => root.dataset.theme || (media.matches ? 'dark' : 'light');
function syncTheme() {
  const dark = currentTheme() === 'dark';
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.querySelector('[data-moon]').hidden = dark;
    toggle.querySelector('[data-sun]').hidden = !dark;
  }
}
if (toggle) {
  toggle.hidden = false;
  syncTheme();
  toggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-switching');
    root.dataset.theme = next;
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      const hostname = location.hostname.toLowerCase();
      const domain = hostname === 'gostoa.dev' || hostname.endsWith('.gostoa.dev')
        ? '; Domain=.gostoa.dev' : '';
      document.cookie = `stoa-theme=${next}; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax; Secure${domain}`;
    } catch (_) { /* Keep the choice in this page when cookies are refused. */ }
    syncTheme();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  });
  media.addEventListener('change', syncTheme);
  // Refresh on tab activation, including choices made on another subdomain.
  function readSharedTheme() {
    try {
      const cookie = document.cookie.split(';').map(part => part.trim())
        .find(part => /^stoa-theme=(light|dark)$/.test(part));
      if (cookie) root.dataset.theme = cookie.split('=')[1];
      else delete root.dataset.theme;
      syncTheme();
    } catch (_) { /* Keep the current page preference when access is refused. */ }
  }
  window.addEventListener('focus', readSharedTheme);
  window.addEventListener('pageshow', readSharedTheme);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) readSharedTheme();
  });
}
const menuButton = document.querySelector('.menu-btn');
const menu = document.getElementById('mobile-menu');
if (menuButton && menu) {
  function setMenu(open = false) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
  }
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    setMenu(menu.hidden);
  });
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    setMenu();
    menuButton.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setMenu(); menuButton.focus(); }
  });
  matchMedia('(min-width: 1081px)').addEventListener('change', event => {
    if (event.matches) {
      if (menu.contains(document.activeElement)) document.querySelector('.brand').focus();
      setMenu();
    }
  });
}
if (navigator.clipboard) document.querySelectorAll('[data-copy]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy)?.querySelector('code');
    if (!code) return;
    const label = button.querySelector('span');
    try { await navigator.clipboard.writeText(code.textContent); label.textContent = button.dataset.copied; }
    catch (_) { label.textContent = button.dataset.error; }
  });
});
