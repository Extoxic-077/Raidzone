import { initNavbar } from './components/rz-nav.js?v=1.1.0';
import { initFooter } from './components/rz-foot.js?v=1.1.0';
import { SocialProof } from './components/SocialProof.js?v=1.0.0';
import { LiveChat } from './components/rz-chat.js?v=2.0.2';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFooter();
  SocialProof.init();
  LiveChat.init();
});
