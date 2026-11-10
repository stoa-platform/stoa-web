// Marketing-only interactions. No requests are sent to the product or an AI provider.
const root = document.querySelector<HTMLElement>('[data-product-home]');
const menu = root?.querySelector<HTMLButtonElement>('.menu-button');
const navigation = root?.querySelector<HTMLElement>('.nav-links');
if (menu && navigation) {
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }));
}
const dialog = root?.querySelector<HTMLDialogElement>('#image-dialog');
const largeScreen = root?.querySelector<HTMLImageElement>('#large-screen');
let zoomOrigin: HTMLButtonElement | undefined;
if (dialog && largeScreen) {
  root?.querySelectorAll<HTMLButtonElement>('.zoom-button[data-image]').forEach(button => {
    button.addEventListener('click', () => {
      zoomOrigin = button;
      largeScreen.src = button.dataset.image ?? '';
      largeScreen.alt = button.dataset.alt ?? '';
      pauseJourney();
      dialog.showModal();
    });
  });
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => zoomOrigin?.focus());
}
const journey = root?.querySelector<HTMLElement>('[data-journey]');
const tabs = Array.from(journey?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
const panels = Array.from(journey?.querySelectorAll<HTMLElement>('[role="tabpanel"]') ?? []);
const play = journey?.querySelector<HTMLButtonElement>('.journey-play');
const playText = play?.querySelector<HTMLElement>('.play-text');
const playSymbol = play?.querySelector<HTMLElement>('.play-symbol');
const counter = journey?.querySelector<HTMLElement>('[data-current-step]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const duration = 4500;
let currentStep = 0;
let playing = false;
let timer: number | undefined;
function pauseJourney() {
  window.clearTimeout(timer);
  timer = undefined;
  playing = false;
  journey?.classList.remove('is-playing');
  if (playText) playText.textContent = currentStep === tabs.length - 1
    ? journey?.dataset.replayLabel ?? '' : journey?.dataset.playLabel ?? '';
  if (playSymbol) playSymbol.textContent = currentStep === tabs.length - 1 ? '↻' : '▶';
}
function selectStep(index: number) {
  currentStep = index;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  panels.forEach((panel, i) => { panel.hidden = i !== index; });
  if (counter) counter.textContent = String(index + 1).padStart(2, '0');
}
function scheduleStep() {
  timer = window.setTimeout(() => {
    if (currentStep === tabs.length - 1) { pauseJourney(); return; }
    selectStep(currentStep + 1);
    scheduleStep();
  }, duration);
}
if (journey && play && tabs.length === panels.length && tabs.length) {
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { pauseJourney(); selectStep(index); pauseJourney(); });
    tab.addEventListener('keydown', event => {
      let next: number;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); pauseJourney(); selectStep(next); pauseJourney(); tabs[next].focus();
    });
  });
  panels.forEach(panel => panel.addEventListener('focusin', pauseJourney));
  play.addEventListener('click', () => {
    if (playing) { pauseJourney(); return; }
    if (reducedMotion.matches) return;
    selectStep(0);
    playing = true;
    journey.classList.add('is-playing');
    if (playText) playText.textContent = journey.dataset.pauseLabel ?? '';
    if (playSymbol) playSymbol.textContent = 'Ⅱ';
    scheduleStep();
  });
  const updateMotionPreference = () => { play.hidden = reducedMotion.matches; if (reducedMotion.matches) pauseJourney(); };
  updateMotionPreference();
  reducedMotion.addEventListener('change', updateMotionPreference);
}
function updateVisibility() {
  root?.classList.toggle('page-is-hidden', document.hidden);
  if (document.hidden) pauseJourney();
}
document.addEventListener('visibilitychange', updateVisibility);
window.addEventListener('pagehide', pauseJourney);
updateVisibility();
if (root && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
      else if (entry.target.classList.contains('hero-in-motion')) entry.target.classList.remove('is-visible');
      if (entry.target === journey && !entry.isIntersecting) pauseJourney();
    });
  }, { threshold: 0.08 });
  root.querySelectorAll('.hero-in-motion, .motion-reveal').forEach(section => observer.observe(section));
} else root?.querySelectorAll('.hero-in-motion, .motion-reveal').forEach(section => section.classList.add('is-visible'));
