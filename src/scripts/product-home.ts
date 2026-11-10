// Presentation-only controls. Screens are static repository captures, not live data.
const root = document.querySelector('[data-product-home]');
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
const tabs = Array.from(root?.querySelectorAll<HTMLButtonElement>('.screen-tabs button') ?? []);
const screen = root?.querySelector<HTMLImageElement>('#product-screen');
const panel = root?.querySelector<HTMLElement>('#screen-panel');
const caption = root?.querySelector<HTMLElement>('#screen-caption');
function selectView(tab: HTMLButtonElement) {
  if (!screen || !panel || !caption) return;
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', tab.id);
  screen.src = tab.dataset.image ?? '';
  screen.alt = tab.dataset.alt ?? '';
  caption.textContent = tab.dataset.caption ?? '';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectView(tab));
  tab.addEventListener('keydown', event => {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); selectView(tabs[next]); tabs[next].focus();
  });
});
const dialog = root?.querySelector<HTMLDialogElement>('#image-dialog');
const largeScreen = root?.querySelector<HTMLImageElement>('#large-screen');
const zoomButton = root?.querySelector<HTMLButtonElement>('#zoom-screen');
if (dialog && largeScreen && zoomButton && screen) {
  zoomButton.addEventListener('click', () => {
    largeScreen.src = screen.src;
    largeScreen.alt = screen.alt;
    dialog.showModal();
  });
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}
