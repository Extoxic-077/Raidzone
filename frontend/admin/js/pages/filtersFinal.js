import { initAuth, isLoggedIn } from '../../../js/auth.js?v=final.1';
import { authApiFetch } from '../../../js/api.js?v=final.1';
import { showToast } from '../../../js/components/toast.js?v=final.1';

const dynamicList = document.getElementById('dynamic-filter-list');
const gameSelector = document.getElementById('game-selector');
const tabSelector  = document.getElementById('tab-selector');
const addFilterBtn = document.getElementById('add-filter-btn');
const saveConfigBtn = document.getElementById('save-config-btn');
const emptyConfig  = document.getElementById('empty-config');

let currentFilters = [];

/**
 * INITIALIZE DYNAMIC MANAGER
 */
async function init() {
  await initAuth();
  if (!isLoggedIn()) { window.location.href = '../../login.html'; return; }
  
  loadConfig();

  gameSelector.addEventListener('change', loadConfig);
  tabSelector.addEventListener('change', loadConfig);
  addFilterBtn.addEventListener('click', addFilterRow);
  saveConfigBtn.addEventListener('click', saveConfig);

  // Initialize Sortable
  if (typeof Sortable !== 'undefined') {
    new Sortable(dynamicList, {
      animation: 150,
      handle: '.filter-drag-handle',
      ghostClass: 'sortable-ghost',
      onEnd: updateFilterOrder
    });
  }
}

/**
 * FETCH CONFIG FROM DB
 */
async function loadConfig() {
  const game = gameSelector.value;
  const tab  = tabSelector.value;
  console.log(`[FilterEngine] Loading config for ${game} / ${tab}`);

  try {
    const data = await authApiFetch(`/filters?game=${game}&tab=${tab}`);
    console.log(`[FilterEngine] Received Data:`, data);
    currentFilters = data.filters || [];
    renderFilters();
  } catch (err) {
    console.error(`[FilterEngine] Load Error:`, err);
    showToast('Failed to load configuration', 'error');
  }
}

/**
 * RENDER THE DRAGGABLE ROWS
 */
function renderFilters() {
  console.log(`[FilterEngine] Rendering ${currentFilters.length} filters`);
  dynamicList.innerHTML = '';
  
  if (currentFilters.length === 0) {
    // Clone node to avoid moving it if it is template-like, or just ensure it is visible
    emptyConfig.style.display = 'block';
    dynamicList.appendChild(emptyConfig);
    return;
  }

  emptyConfig.style.display = 'none';

  currentFilters.forEach((filter, index) => {
    const row = document.createElement('div');
    row.className = 'type-card fade-in';
    row.style.cssText = 'display:flex; align-items:center; gap:15px; padding:15px; margin-bottom:10px; cursor:default;';
    row.dataset.index = index;

    row.innerHTML = `
      <div class="filter-drag-handle" style="cursor:grab; color:var(--text-4); font-size:20px;">☰</div>
      
      <div style="flex:1;">
        <label style="display:block; font-size:10px; color:var(--text-4); margin-bottom:4px;">LABEL (UI)</label>
        <input type="text" class="admin-form-input label-input" value="${filter.label}" placeholder="e.g. Blueprint" style="padding:6px 10px; font-size:13px;">
      </div>

      <div style="flex:1;">
        <label style="display:block; font-size:10px; color:var(--text-4); margin-bottom:4px;">KEY (DB FIELD)</label>
        <input type="text" class="admin-form-input key-input" value="${filter.key}" placeholder="e.g. blueprint" style="padding:6px 10px; font-size:13px;">
      </div>

      <div style="width:140px;">
        <label style="display:block; font-size:10px; color:var(--text-4); margin-bottom:4px;">TYPE</label>
        <select class="admin-form-select type-input" style="padding:4px 10px; font-size:12px;">
           <option value="dropdown" ${filter.type === 'dropdown' ? 'selected' : ''}>Dropdown</option>
           <option value="chips" ${filter.type === 'chips' ? 'selected' : ''}>Chips (Buttons)</option>
           <option value="range" ${filter.type === 'range' ? 'selected' : ''}>Price Range</option>
           <option value="search" ${filter.type === 'search' ? 'selected' : ''}>Search Box</option>
        </select>
      </div>

      <button class="btn-admin-cancel delete-filter-btn" style="padding:8px; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; margin-top:16px;">×</button>
    `;

    // Bind delete
    row.querySelector('.delete-filter-btn').addEventListener('click', () => {
      currentFilters.splice(index, 1);
      renderFilters();
    });

    dynamicList.appendChild(row);
  });
}

function addFilterRow() {
  currentFilters.push({
    label: '',
    key: '',
    type: 'dropdown',
    order: currentFilters.length
  });
  renderFilters();
}

function updateFilterOrder() {
  const rows = [...dynamicList.querySelectorAll('.type-card')];
  const newFilters = rows.map((row, idx) => {
    const label = row.querySelector('.label-input').value;
    const key = row.querySelector('.key-input').value;
    const type = row.querySelector('.type-input').value;
    return { label, key, type, order: idx };
  });
  currentFilters = newFilters;
}

/**
 * PUSH CONFIG TO DB
 */
async function saveConfig() {
  updateFilterOrder(); // Sink current inputs
  
  const game = gameSelector.value;
  const tab  = tabSelector.value;

  try {
    await authApiFetch('/filters', {
      method: 'POST',
      body: JSON.stringify({
        game,
        tab,
        filters: currentFilters
      })
    });

    showToast(`Filter Layout for ${game}/${tab} Saved!`, 'success');
  } catch (err) {
    showToast('Failed to save configuration', 'error');
  }
}

init();
