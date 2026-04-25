/**
 * RAIDZONE — Premium Live Support Chat v2.0
 * Features: Glassmorphism, Gradient Bubbles, Timestamps, Unread Badge,
 *           Notification Sound, Typing Indicator, System Messages
 */

import { authFetch, getAccessToken, getUser, initAuth } from '../auth.js';

export const LiveChat = (() => {
  let stompClient  = null;
  let currentThreadId = null;
  let isChatOpen   = false;
  let currentUserId = null;
  let unreadCount  = 0;
  let typingTimer  = null;
  let isTypingShown = false;
  let audioCtx     = null;

  /* ── Audio ──────────────────────────────────────────────────────────────── */
  function playPing() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine'; o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
      g.gain.setValueAtTime(0.18, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      o.start(); o.stop(audioCtx.currentTime + 0.4);
    } catch {}
  }

  /* ── Formatting ─────────────────────────────────────────────────────────── */
  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  /* ── Unread Badge ────────────────────────────────────────────────────────── */
  function setUnread(n) {
    unreadCount = n;
    const badge = document.getElementById('rz-chat-badge');
    if (!badge) return;
    if (n > 0) {
      badge.textContent = n > 9 ? '9+' : n;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ── Typing Indicator ────────────────────────────────────────────────────── */
  function showTyping() {
    if (isTypingShown) return;
    isTypingShown = true;
    const body = document.getElementById('rz-chat-messages');
    if (!body) return;
    const el = document.createElement('div');
    el.id = 'rz-typing-indicator';
    el.className = 'rz-chat-msg rz-chat-msg-other';
    el.innerHTML = `
      <div class="rz-chat-bubble rz-typing-bubble">
        <span class="rz-dot"></span>
        <span class="rz-dot"></span>
        <span class="rz-dot"></span>
      </div>`;
    body.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    isTypingShown = false;
    document.getElementById('rz-typing-indicator')?.remove();
  }

  /* ── Append Message ──────────────────────────────────────────────────────── */
  function appendMessage(msg, animate = true) {
    hideTyping();
    const isMe = msg.senderId === currentUserId;
    const body = document.getElementById('rz-chat-messages');
    if (!body) return;

    const wrapper = document.createElement('div');
    wrapper.className = `rz-chat-msg ${isMe ? 'rz-chat-msg-me' : 'rz-chat-msg-other'}${animate ? ' rz-msg-animate' : ''}`;

    const roleLabel = (!isMe && msg.isAdmin)
      ? `<div class="rz-chat-msg-role">
           <span class="rz-support-dot"></span> Support
         </div>`
      : '';

    const ts = msg.sentAt || msg.createdAt || null;
    const timeStr = ts ? formatTime(ts) : formatTime(new Date().toISOString());

    wrapper.innerHTML = `
      ${roleLabel}
      <div class="rz-chat-bubble">${escapeHtml(msg.content)}</div>
      <div class="rz-chat-timestamp">${timeStr}</div>
    `;
    body.appendChild(wrapper);
    scrollToBottom();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* ── System Message ──────────────────────────────────────────────────────── */
  function appendSystem(text) {
    const body = document.getElementById('rz-chat-messages');
    if (!body) return;
    const el = document.createElement('div');
    el.className = 'rz-chat-system';
    el.textContent = text;
    body.appendChild(el);
    scrollToBottom();
  }

  /* ── Scroll ──────────────────────────────────────────────────────────────── */
  function scrollToBottom() {
    const body = document.getElementById('rz-chat-messages');
    if (!body) return;
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }

  /* ── WS Connection ───────────────────────────────────────────────────────── */
  function connectWS(token) {
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

    stompClient.onConnect = async () => {
      await loadHistoryAndSubscribe();
      appendSystem('Support team is online · We typically reply in minutes');
    };

    stompClient.onStompError = () => appendSystem('Connection error — retrying…');
    stompClient.onWebSocketError = () => appendSystem('Connection error — retrying…');
    stompClient.activate();
  }

  async function loadHistoryAndSubscribe() {
    try {
      const user = getUser();
      if (!user) return;
      currentUserId = user.id;

      const resp = await authFetch('/api/v1/chat/my-thread');
      const data = await resp.json();
      if (!data.success) throw new Error(data.message);
      currentThreadId = data.data.id;

      // Subscribe: incoming messages
      stompClient.subscribe(`/topic/chat/${currentThreadId}`, (msg) => {
        const payload = JSON.parse(msg.body);

        // Typing frames
        if (payload.type === 'TYPING') { showTypingFor(3000); return; }

        appendMessage(payload, true);

        if (!isChatOpen) {
          playPing();
          setUnread(unreadCount + 1);
        } else {
          markRead();
        }
      });

      // Load history
      const histResp = await authFetch(`/api/v1/chat/threads/${currentThreadId}/messages`);
      const histData = await histResp.json();
      if (!histData.success) throw new Error(histData.message);

      const body = document.getElementById('rz-chat-messages');
      if (body) {
        body.innerHTML = '';
        histData.data.forEach(m => appendMessage(m, false));
        scrollToBottom();
      }
    } catch(e) {
      console.error('[Chat] Failed to load history', e);
    }
  }

  function showTypingFor(ms) {
    showTyping();
    clearTimeout(typingTimer);
    typingTimer = setTimeout(hideTyping, ms);
  }

  /* ── Send ────────────────────────────────────────────────────────────────── */
  function markRead() {
    if (!currentThreadId) return;
    authFetch(`/api/v1/chat/threads/${currentThreadId}/read`, { method: 'POST' }).catch(() => {});
  }

  async function sendMessage(text) {
    if (!stompClient?.connected || !currentThreadId) return;
    const token = getAccessToken();
    stompClient.publish({
      destination: `/app/chat/${currentThreadId}`,
      headers: { Authorization: 'Bearer ' + token, authorization: 'Bearer ' + token },
      body: JSON.stringify({ content: text })
    });
  }

  /* ── Events ──────────────────────────────────────────────────────────────── */
  function bindEvents() {
    const toggleBtn = document.getElementById('rz-chat-toggle');
    const windowEl  = document.getElementById('rz-chat-window');
    const closeBtn  = document.getElementById('rz-chat-close');
    const form      = document.getElementById('rz-chat-form');
    const input     = document.getElementById('rz-chat-input');

    toggleBtn.addEventListener('click', () => {
      isChatOpen = !isChatOpen;
      windowEl.classList.toggle('open', isChatOpen);
      if (isChatOpen) {
        setUnread(0);
        markRead();
        setTimeout(() => input.focus(), 120);
        scrollToBottom();
      }
    });

    closeBtn.addEventListener('click', () => {
      isChatOpen = false;
      windowEl.classList.remove('open');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = input.value.trim();
      if (!txt) return;
      sendMessage(txt);
      input.value = '';
    });
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  async function init() {
    injectStyles();
    injectHTML();
    bindEvents();

    await initAuth();
    const token = getAccessToken();
    if (!token) {
      const body = document.getElementById('rz-chat-messages');
      if (body) body.innerHTML = `
        <div class="rz-chat-msg rz-chat-msg-other">
          <div class="rz-chat-bubble">
            <div class="rz-chat-msg-role"><span class="rz-support-dot"></span> System</div>
            Please <a href="/login.html" style="color:#22D3EE;text-decoration:underline;">Sign In</a> to contact support.
          </div>
        </div>`;
      return;
    }

    await loadScript('https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@stomp/stompjs@5.0.0/bundles/stomp.umd.min.js');
    connectWS(token);
  }

  function loadScript(src) {
    return new Promise(resolve => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  /* ── HTML ────────────────────────────────────────────────────────────────── */
  function injectHTML() {
    const el = document.createElement('div');
    el.innerHTML = `
      <div id="rz-chat-wrapper">
        <div id="rz-chat-window">
          <div class="rz-chat-header">
            <div class="rz-chat-header-left">
              <div class="rz-chat-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="rz-chat-header-info">
                <h4>Live Support</h4>
                <p><span class="rz-online-dot"></span> We typically reply in minutes</p>
              </div>
            </div>
            <button id="rz-chat-close" aria-label="Close chat">&times;</button>
          </div>
          <div id="rz-chat-messages"></div>
          <form id="rz-chat-form">
            <input type="text" id="rz-chat-input" placeholder="Type a message…" autocomplete="off"/>
            <button type="submit" aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </form>
        </div>
        <button id="rz-chat-toggle" aria-label="Open support chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span id="rz-chat-badge"></span>
        </button>
      </div>`;
    document.body.appendChild(el);
  }

  /* ── Styles ──────────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('rz-chat-style')) return;
    const style = document.createElement('style');
    style.id = 'rz-chat-style';
    style.textContent = `
      /* ── Wrapper ── */
      #rz-chat-wrapper {
        position: fixed; bottom: 24px; right: 24px;
        z-index: 10000; display: flex; flex-direction: column; align-items: flex-end;
      }
      @media (max-width: 767px) {
        #rz-chat-wrapper {
          bottom: 90px !important; /* Move it up above bottom nav */
          right: 16px !important;
        }
      }

      /* ── Toggle Button ── */
      #rz-chat-toggle {
        position: relative;
        width: 58px; height: 58px; border-radius: 50%;
        background: linear-gradient(135deg,#7C3AED,#22D3EE);
        color: #fff; border: none;
        box-shadow: 0 8px 28px rgba(124,58,237,0.45);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
      }
      #rz-chat-toggle:hover {
        transform: scale(1.1) translateY(-2px);
        box-shadow: 0 14px 36px rgba(124,58,237,0.55);
      }

      /* ── Unread Badge ── */
      #rz-chat-badge {
        display: none;
        position: absolute; top: 0; right: 0;
        min-width: 20px; height: 20px;
        background: #EF4444; color: #fff;
        border-radius: 10px; font-size: 11px; font-weight: 700;
        line-height: 20px; text-align: center; padding: 0 5px;
        border: 2px solid #0d0d1a;
        animation: rz-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes rz-badge-pop { from { transform: scale(0); } to { transform: scale(1); } }

      /* ── Chat Window ── */
      #rz-chat-window {
        width: 370px; height: 520px;
        max-height: calc(100vh - 100px);
        background: rgba(10,10,22,0.96);
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; margin-bottom: 14px;
        display: flex; flex-direction: column; overflow: hidden;
        opacity: 0; pointer-events: none;
        transform: translateY(24px) scale(0.94);
        transform-origin: bottom right;
        transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
        box-shadow: 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
      }
      #rz-chat-window.open {
        opacity: 1; pointer-events: auto; transform: translateY(0) scale(1);
      }

      /* ── Header ── */
      .rz-chat-header {
        padding: 14px 16px;
        background: linear-gradient(135deg,rgba(124,58,237,0.18),rgba(34,211,238,0.10));
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex; justify-content: space-between; align-items: center;
      }
      .rz-chat-header-left { display: flex; align-items: center; gap: 12px; }
      .rz-chat-avatar {
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg,#7C3AED,#22D3EE);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(124,58,237,0.4);
        flex-shrink: 0;
      }
      .rz-chat-header-info h4 {
        margin: 0; font-size: 15px; font-weight: 700; color: #fff;
        font-family: var(--font-heading, 'Syne', sans-serif);
      }
      .rz-chat-header-info p {
        margin: 3px 0 0 0; font-size: 12px; color: #9CA3AF;
        display: flex; align-items: center; gap: 5px;
      }
      .rz-online-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #22C55E;
        box-shadow: 0 0 6px #22C55E;
        display: inline-block;
        animation: rz-pulse-green 2s infinite;
      }
      @keyframes rz-pulse-green {
        0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
        50%      { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
      }
      #rz-chat-close {
        background: none; border: none; color: #6B7280;
        font-size: 26px; cursor: pointer; line-height: 1;
        transition: color 0.2s;
      }
      #rz-chat-close:hover { color: #fff; }

      /* ── Messages ── */
      #rz-chat-messages {
        flex: 1; overflow-y: auto;
        padding: 16px 14px; display: flex;
        flex-direction: column; gap: 10px;
        scroll-behavior: smooth;
      }
      #rz-chat-messages::-webkit-scrollbar { width: 4px; }
      #rz-chat-messages::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.08); border-radius: 4px;
      }

      /* ── Message bubbles ── */
      .rz-chat-msg {
        display: flex; flex-direction: column; max-width: 82%;
      }
      .rz-chat-msg-me    { align-self: flex-end; align-items: flex-end; }
      .rz-chat-msg-other { align-self: flex-start; align-items: flex-start; }

      .rz-chat-msg-role {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px;
        color: #22D3EE; font-weight: 700; margin-bottom: 4px;
        display: flex; align-items: center; gap: 4px;
      }
      .rz-support-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #22D3EE; display: inline-block;
      }

      .rz-chat-bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px; line-height: 1.5;
        word-break: break-word;
      }
      .rz-chat-msg-me .rz-chat-bubble {
        background: linear-gradient(135deg,#7C3AED,#22D3EE);
        color: #fff;
        border-bottom-right-radius: 4px;
        box-shadow: 0 4px 16px rgba(124,58,237,0.35);
      }
      .rz-chat-msg-other .rz-chat-bubble {
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.07);
        color: #E5E7EB;
        border-bottom-left-radius: 4px;
      }

      .rz-chat-timestamp {
        font-size: 10px; color: #4B5563; margin-top: 3px;
      }

      /* ── Animate new message ── */
      .rz-msg-animate {
        animation: rz-msg-in 0.28s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes rz-msg-in {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* ── System Message ── */
      .rz-chat-system {
        align-self: center; font-size: 11px; color: #6B7280;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 20px; padding: 4px 12px;
        letter-spacing: 0.3px; text-align: center;
      }

      /* ── Typing Indicator ── */
      .rz-typing-bubble {
        display: flex; align-items: center; gap: 5px;
        padding: 12px 16px;
      }
      .rz-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: rgba(255,255,255,0.4);
        animation: rz-typing 1.2s infinite;
      }
      .rz-dot:nth-child(2) { animation-delay: 0.2s; }
      .rz-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes rz-typing {
        0%,60%,100% { transform: translateY(0); opacity: 0.4; }
        30%          { transform: translateY(-5px); opacity: 1; }
      }

      /* ── Form / Input ── */
      #rz-chat-form {
        padding: 12px; border-top: 1px solid rgba(255,255,255,0.05);
        display: flex; gap: 8px; align-items: center;
        background: rgba(0,0,0,0.25);
      }
      #rz-chat-input {
        flex: 1; height: 42px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 21px; padding: 0 16px;
        color: #fff; font-size: 14px; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        font-family: var(--font-body, 'DM Sans', sans-serif);
      }
      #rz-chat-input::placeholder { color: #4B5563; }
      #rz-chat-input:focus {
        border-color: rgba(124,58,237,0.5);
        box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
      }
      #rz-chat-form button[type="submit"] {
        width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
        background: linear-gradient(135deg,#7C3AED,#22D3EE);
        border: none; color: #fff;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(124,58,237,0.35);
      }
      #rz-chat-form button[type="submit"]:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(124,58,237,0.5);
      }

      /* ── Mobile ── */
      @media (max-width: 480px) {
        #rz-chat-wrapper { bottom: 16px; right: 16px; }
        #rz-chat-window  { width: calc(100vw - 32px); }
      }
    `;
    document.head.appendChild(style);
  }

  return { init };
})();
