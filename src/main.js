import { all, create } from 'mathjs';
import { registerSW } from 'virtual:pwa-register';
import './platform-api.js';

globalThis.math = create(all);

if ('__TAURI_INTERNALS__' in window) {
  document.addEventListener('contextmenu', event => event.preventDefault());
}

if (!('__TAURI_INTERNALS__' in window)) {
  registerSW({ immediate: true });
}

import('./renderer.js').catch(error => {
  console.error('Could not start Tally:', error);
  document.documentElement.classList.remove('renderer-ready');
  const status = document.getElementById('currency-status');
  if (status) {
    status.textContent = 'Tally could not finish starting. Open developer tools for details.';
    status.hidden = false;
  }
});
