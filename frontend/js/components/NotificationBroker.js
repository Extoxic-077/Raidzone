import { getAccessToken, getUser, isLoggedIn, isAdmin } from '../auth.js';
import { showToast } from './toast.js';
import { SocialProof } from './SocialProof.js';

/**
 * NotificationBroker
 * Handles global WebSocket subscriptions for:
 * 1. Personal real-time notifications (Order status, security alerts)
 * 2. Social Proof (Public purchase activity)
 * 3. Admin Alerts (New orders, system events)
 */
export const NotificationBroker = (() => {
  let stompClient = null;

  async function connect() {
    if (!isLoggedIn()) return;
    const token = getAccessToken();
    const user  = getUser();
    if (!token || !user) return;

    // Load STOMP if not present (usually loaded by LiveChat, but we ensure here)
    if (!window.StompJs) {
        await loadScript('https://cdn.jsdelivr.net/npm/@stomp/stompjs@5.0.0/bundles/stomp.umd.min.js');
    }

    const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws/websocket';

    stompClient = new window.StompJs.Client({
      brokerURL: wsUrl,
      connectHeaders: { 
        Authorization: 'Bearer ' + token, 
        authorization: 'Bearer ' + token 
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    stompClient.onConnect = () => {
      console.log('[NotificationBroker] Connected');

      // 1. Private Notifications (User specific)
      stompClient.subscribe(`/topic/user/${user.id}/notifications`, (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          
          // Show visual toast
          showToast(payload.message || payload.title || 'New notification', 'success');
          
          // Play subtle notification sound if available
          playNotificationSound();

          // Trigger navbar badge refresh
          window.dispatchEvent(new CustomEvent('refresh-notifications'));
        } catch (e) {
          console.error('[Broker] Notification parse error', e);
        }
      });

      // 2. Social Proof (Global activity)
      stompClient.subscribe('/topic/social-proof', (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          SocialProof.pushActivity(payload);
        } catch (e) { /* ignore */ }
      });

      // 3. Admin Alerts (Only for Staff/Admin)
      if (isAdmin() || user.role === 'ADMIN' || user.role === 'STAFF') {
        stompClient.subscribe('/topic/admin/orders', (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            // High-priority toast for admins
            showToast(`🔔 NEW ORDER: ₹${payload.total} (#${payload.id.substring(0,8).toUpperCase()})`, 'info');
            
            // Trigger admin sidebar badge refresh
            window.dispatchEvent(new CustomEvent('refresh-admin-badges'));
          } catch (e) { /* ignore */ }
        });
      }
    };

    stompClient.onStompError = (frame) => {
      console.error('[NotificationBroker] STOMP Error', frame.headers['message']);
    };

    stompClient.activate();
  }

  let audioCtx = null;
  function playNotificationSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      o.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      g.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start(); o.stop(audioCtx.currentTime + 0.3);
    } catch (e) { /* ignore browser audio policy block */ }
  }

  function loadScript(src) {
    return new Promise(resolve => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  return { 
    init: () => {
        // Delay connection slightly to avoid race during page load
        setTimeout(connect, 1000);
    }
  };
})();
