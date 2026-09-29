import { initTabs } from './modules/tabs.js';
import { initReveal } from './modules/reveal.js';
import { initSignup } from './modules/form.js';
import { initSmoothScroll, addShakeKeyframe } from './modules/utils.js';
import { initNewsletterViews } from './modules/newsletter.js';

document.addEventListener('DOMContentLoaded', () => {
  addShakeKeyframe();
  initTabs();
  initReveal();
  initSignup();
  initSmoothScroll();
  initNewsletterViews();
});
