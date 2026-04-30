import { initAuth } from './auth.js';
import { initNavbar } from './components/rz-nav.js';
import { initFooter } from './components/rz-foot.js';
import { SocialProof } from './components/SocialProof.js';
import { LiveChat } from './components/rz-chat.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  initNavbar();
  initFooter();
  SocialProof.init();
  LiveChat.init();
});
