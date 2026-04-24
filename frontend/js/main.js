import { initNavbar } from './components/rz-nav.js';
import { initFooter } from './components/rz-foot.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  initFooter();
});
