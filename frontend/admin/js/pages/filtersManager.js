import { initAdminSidebar } from '../adminSidebar.js';
import { initAuth, isLoggedIn, isAdmin, getAccessToken } from '../../../js/auth.js';
import { showToast } from '../../../js/components/toast.js';

await initAuth();
if (!isLoggedIn() || !isAdmin()) window.location.href = '../login.html';
await initAdminSidebar('filters');

const BASE_URL = '/api/admin/filters';
const headers = {
  'Authorization': `Bearer ${getAccessToken()}`,
  'Content-Type': 'application/json'
};

let itemTypes = [];
let blueprints = [];

// ── LOADING DATA ─────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const [typesRes, bpsRes] = await Promise.all([
      fetch(`${BASE_URL}/item-types`, { headers }),
      fetch(`${BASE_URL}/blueprints`, { headers })
    ]);

    itemTypes = await typesRes.json();
    blueprints = await bpsRes.json();

    renderItemTypes();
    renderBlueprintMapping();
    populateTypeSelect();
  } catch (err) {
    showToast('Failed to load filters', 'error');
  }
}

// ── RENDERING ────────────────────────────────────────────────────────────────

function renderItemTypes() {
  const container = document.getElementById('type-list-container');
  container.innerHTML = itemTypes.map(type => `
    <div class="type-card" data-id="${type._id}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600;">${type.name}</span>
        <div style="display:flex; gap:8px;">
           <button class="btn-icon" data-action="edit-type" data-id="${type._id}">✎</button>
           <button class="btn-icon danger" data-action="delete-type" data-id="${type._id}">×</button>
        </div>
      </div>
      <div style="font-size:11px; opacity:0.6; margin-top:4px;">slug: ${type.slug}</div>
    </div>
  `).join('');

  // Reordering Sortable
  new Sortable(container, {
    animation: 150,
    onEnd: async (evt) => {
      const ids = Array.from(container.children).map(el => el.dataset.id);
      // Update sortOrder on backend (simplified: just send order)
      await fetch(`${BASE_URL}/item-types/reorder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids })
      });
      showToast('Order saved', 'success');
    }
  });
}

function renderBlueprintMapping() {
  const container = document.getElementById('blueprint-mapping-container');
  const gameFilter = document.getElementById('game-filter').value;

  container.innerHTML = itemTypes.map(type => {
    const filteredBps = blueprints.filter(bp => 
      bp.itemType === type.slug && 
      (gameFilter === 'all' || bp.game === gameFilter)
    );

    return `
      <div class="mapping-section" style="margin-bottom: 24px;">
        <h4 style="font-size: 13px; color: var(--violet-light); margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
          ${type.name} 
          <span style="font-size:10px; font-weight:400; color:var(--text-4)">${filteredBps.length} Blueprints</span>
        </h4>
        <div class="blueprint-list" data-type-slug="${type.slug}">
          ${filteredBps.map(bp => `
            <div class="bp-item" data-id="${bp._id}">
              <div class="bp-info">
                <div class="bp-name">${bp.name}</div>
                <div class="bp-game">${bp.game}</div>
              </div>
              <button class="btn-icon danger sm" data-action="delete-bp" data-id="${bp._id}">×</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Drag & Drop between types
  container.querySelectorAll('.blueprint-list').forEach(list => {
    new Sortable(list, {
      group: 'blueprints',
      animation: 150,
      onAdd: async (evt) => {
        const id = evt.item.dataset.id;
        const newTypeSlug = list.dataset.typeSlug;
        
        await fetch(`${BASE_URL}/blueprints/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ itemType: newTypeSlug })
        });
        showToast('Mapping updated', 'success');
      }
    });
  });
}

function populateTypeSelect() {
  const select = document.getElementById('type-select');
  select.innerHTML = itemTypes.map(t => `<option value="${t.slug}">${t.name}</option>`).join('');
}

// ── CRUD HANDLERS ────────────────────────────────────────────────────────────

document.getElementById('add-type-btn').onclick = () => {
  document.getElementById('type-modal').classList.add('open');
};

document.getElementById('add-blueprint-btn').onclick = () => {
  document.getElementById('blueprint-modal').classList.add('open');
};

document.getElementById('type-form').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  const res = await fetch(`${BASE_URL}/item-types`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  if (res.ok) {
    showToast('Item type created', 'success');
    closeModals();
    loadData();
  }
};

document.getElementById('blueprint-form').onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.keywords = data.keywords.split(',').map(k => k.trim());

  const res = await fetch(`${BASE_URL}/blueprints`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  if (res.ok) {
    showToast('Blueprint created', 'success');
    closeModals();
    loadData();
  }
};

window.closeModals = () => {
  document.querySelectorAll('.admin-modal-overlay').forEach(m => m.classList.remove('open'));
};

document.addEventListener('click', async (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === 'delete-type') {
    if (confirm('Delete this item type? Any blueprint mapping to it will break.')) {
      await fetch(`${BASE_URL}/item-types/${id}`, { method: 'DELETE', headers });
      loadData();
    }
  }

  if (action === 'delete-bp') {
    if (confirm('Delete this blueprint?')) {
      await fetch(`${BASE_URL}/blueprints/${id}`, { method: 'DELETE', headers });
      loadData();
    }
  }
});

document.getElementById('game-filter').onchange = renderBlueprintMapping;

loadData();
