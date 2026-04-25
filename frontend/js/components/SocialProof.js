/**
 * RAIDZONE — Social Proof Notification System
 * Displays recent purchase activity as subtle popups.
 */

export const SocialProof = (() => {
  const API = '/api/v1';
  let activityQueue = [];
  let isDisplaying = false;
  const POPUP_ID = 'social-proof-popup';

  const CITIES = [
    'United States', 'Germany', 'United Kingdom', 'Canada', 'France',
    'Australia', 'India', 'Brazil', 'Japan', 'South Korea', 'Singapore',
    'UAE', 'Netherlands', 'Sweden', 'Norway', 'Finland'
  ];

  async function fetchActivity() {
    try {
      const resp = await fetch(`${API}/public/activity`);
      const data = await resp.json();
      if (data.success && data.data.length > 0) {
        return data.data;
      }
    } catch (e) {
      console.warn('SocialProof: Failed to fetch real activity, using simulation.', e);
    }
    return null;
  }

  function getSimulatedActivity() {
    const products = [
      'Extended Barrel Blueprint',
      'Extended Light Magazine III Blueprint',
      '1,000,000 Arc Raiders Coins (1M)',
      '10,000,000 Arc Raiders Coins (10M)',
      'Heavy Gun Parts Blueprint',
      'Equalizer Blueprint',
      'Combat Mk. 3 (Flanking)',
      'Defibrillator Blueprint',
      'Fireworks Box Blueprint',
      'Explosive Mine Blueprint',
      'Angled Grip III Blueprint'
    ];
    const names = [
      'Sam W.', 'Li Z.', 'Marcus K.', 'Sarah J.', 'Elena R.', 'Hiroshi T.', 'Alex M.', 'Chloe B.', 'David L.', 'Fiona G.', 'Ivan P.', 'Yuki S.',
      'Jack R.', 'Mia K.', 'Noah B.', 'Emma S.', 'Oliver T.', 'Ava D.', 'Lucas M.', 'Sophia L.', 'Ben H.', 'Isabella C.', 'Liam G.', 'Mia F.',
      'James P.', 'Charlotte W.', 'William J.', 'Amelia E.', 'Benjamin R.', 'Harper A.', 'Elijah V.', 'Evelyn N.', 'Lucas Q.', 'Abigail K.',
      'Mason X.', 'Emily Y.', 'Logan Z.', 'Elizabeth M.', 'Alexander O.', 'Avery I.', 'Ethan U.', 'Sofia J.', 'Sebastian W.', 'Ella P.',
      'Jacob K.', 'Madison L.', 'Michael B.', 'Scarlett G.', 'Daniel S.', 'Victoria F.', 'Henry D.', 'Aria T.', 'Jackson N.', 'Grace C.',
      'Levi R.', 'Chloe H.', 'Owen V.', 'Camila M.', 'Wyatt P.', 'Penelope J.', 'Carter S.', 'Luna E.', 'Jayden B.', 'Mila D.'
    ];
    
    return [{
      customerName: names[Math.floor(Math.random() * names.length)],
      productName: products[Math.floor(Math.random() * products.length)],
      createdAt: new Date().toISOString()
    }];
  }

  function injectStyles() {
    if (document.getElementById('social-proof-styles')) return;
    const style = document.createElement('style');
    style.id = 'social-proof-styles';
    style.textContent = `
      #${POPUP_ID} {
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: rgba(15, 15, 26, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(124, 58, 237, 0.3);
        border-radius: 16px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        z-index: 9999;
        transform: translateY(150%);
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        opacity: 0;
        max-width: 320px;
        pointer-events: none;
      }
      #${POPUP_ID}.show {
        transform: translateY(0);
        opacity: 1;
      }
      .sp-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #7C3AED, #22D3EE);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .sp-content {
        flex: 1;
      }
      .sp-title {
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sp-subtitle {
        color: #9CA3AF;
        font-size: 11px;
        font-weight: 500;
      }
      .sp-time {
        font-size: 10px;
        color: #6B7280;
        margin-left: 4px;
      }
      @media (max-width: 768px) {
        #${POPUP_ID} {
          bottom: 80px; 
          left: 16px;
          right: 16px;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function showPopup(activity) {
    if (isDisplaying) return;
    isDisplaying = true;

    let el = document.getElementById(POPUP_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = POPUP_ID;
      document.body.appendChild(el);
    }

    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    el.innerHTML = `
      <div class="sp-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="sp-content">
        <div class="sp-title">${activity.customerName} from ${city}</div>
        <div class="sp-subtitle">Purchased <b>${activity.productName}</b></div>
      </div>
    `;

    setTimeout(() => el.classList.add('show'), 100);

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        isDisplaying = false;
        processNext();
      }, 700);
    }, 5000);
  }

  async function processNext() {
    if (activityQueue.length === 0) {
      const real = await fetchActivity();
      activityQueue = real || getSimulatedActivity();
    }
    
    const next = activityQueue.shift();
    if (next) {
      setTimeout(() => showPopup(next), Math.random() * 5000 + 5000);
    }
  }

  return {
    init: () => {
      injectStyles();
      processNext();
    },
    pushActivity: (activity) => {
      activityQueue.unshift(activity); // Priority
      if (!isDisplaying) processNext();
    }
  };
})();
