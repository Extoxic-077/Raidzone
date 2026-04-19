import { initNavbar } from './components/navbar.js';
import { initFooter } from './components/footer.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  initFooter();
});
