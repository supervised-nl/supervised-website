import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const repo = resolve(process.argv[2] || '.');
const source = readFileSync(join(repo, 'themes/supervised/assets/js/site.js'), 'utf8');

function classList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    contains: (name) => values.has(name),
    toggle(name, force) {
      const next = force === undefined ? !values.has(name) : force;
      if (next) values.add(name);
      else values.delete(name);
      return next;
    }
  };
}

function element(dataset = {}) {
  return {
    dataset,
    attributes: {},
    listeners: {},
    classList: classList(),
    addEventListener(type, listener) { this.listeners[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    getAttribute(name) { return this.attributes[name] || null; },
    querySelector() { return null; },
    contains() { return false; },
    focus() {}
  };
}

function boot({ legacyColorScheme = false } = {}) {
  const themeButtons = [element({ themeChoice: 'light' }), element({ themeChoice: 'dark' })];
  const mobileToggle = element();
  const firstLink = element();
  const mobileMenu = element();
  mobileMenu.querySelector = (selector) => selector === 'a' ? firstLink : null;
  const main = element();
  const footer = element();
  const panelLink = element();
  const panel = element();
  panel.querySelector = (selector) => selector === '.nav-link' ? panelLink : null;

  const documentListeners = {};
  const documentElement = element();
  const body = element();
  body.append = () => {};
  const byId = { 'mobile-menu-toggle': mobileToggle, 'mobile-menu': mobileMenu, content: main };
  const document = {
    documentElement,
    body,
    currentScript: null,
    activeElement: null,
    querySelectorAll(selector) {
      if (selector === '[data-theme-choice]') return themeButtons;
      if (selector === '#menu .has-panel') return [panel];
      if (selector === 'header > :not(#mobile-menu-toggle)') return [];
      return [];
    },
    querySelector: (selector) => selector === 'footer' ? footer : null,
    getElementById: (id) => byId[id] || null,
    createElement: () => element(),
    addEventListener(type, listener) { documentListeners[type] = listener; }
  };

  let modernListener = false;
  let legacyListener = false;
  const window = {
    innerWidth: 500,
    innerHeight: 800,
    scrollY: 0,
    addEventListener() {},
    matchMedia(query) {
      const media = { matches: false };
      if (query === '(prefers-color-scheme: dark)' && legacyColorScheme) {
        media.addListener = () => { legacyListener = true; };
      } else {
        media.addEventListener = () => { modernListener = true; };
      }
      return media;
    }
  };

  vm.runInNewContext(source, {
    document,
    window,
    localStorage: { setItem() {} },
    setTimeout,
    clearTimeout
  });

  return { body, documentListeners, mobileMenu, mobileToggle, modernListener, legacyListener };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const modern = boot();
assert(modern.modernListener, 'Modern color-scheme listener was not registered');
assert(modern.mobileToggle.listeners.click, 'Mobile menu click listener was not registered');
modern.mobileToggle.listeners.click();
assert(modern.body.classList.contains('mobile-nav-open'), 'Mobile menu did not open');
assert(modern.mobileToggle.attributes['aria-expanded'] === 'true', 'Mobile toggle state was not exposed');
assert(modern.mobileMenu.attributes['aria-hidden'] === 'false', 'Open mobile menu remained hidden');
modern.documentListeners.keydown({ key: 'Escape' });
assert(!modern.body.classList.contains('mobile-nav-open'), 'Escape did not close the mobile menu');

const legacy = boot({ legacyColorScheme: true });
assert(legacy.legacyListener, 'Legacy color-scheme listener was not registered');
assert(legacy.mobileToggle.listeners.click, 'Legacy MediaQueryList prevented navigation setup');

console.log('Site JavaScript tests passed.');
