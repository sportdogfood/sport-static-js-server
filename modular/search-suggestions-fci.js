import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';

console.log("[FCI] search-suggestions-fci.js loaded.");

// Utility for unique pills
function getUnique(arr, key) {
  return [...new Set(arr.map(x => (x[key] || '').trim()).filter(Boolean))];
}

// --- Prepare indexed data ---
const items = CI_DATA.map(row => ({
  ...row,
  keyList: [
    (row.name || '').toLowerCase(),
    (row['data-one'] || '').toLowerCase(),
    (row['data-brand'] || '').toLowerCase(),
    (row['data-diet'] || '').toLowerCase(),
    (row['data-legumes'] || '').toLowerCase(),
    (row['data-poultry'] || '').toLowerCase(),
    (row['data-grain'] || '').toLowerCase(),
  ].filter(Boolean),
}));

// --- Build Pill Data ---
const brands   = getUnique(items, 'data-brand');
const diets    = getUnique(items, 'data-diet');
const legumes  = getUnique(items, 'data-legumes');
const poultry  = getUnique(items, 'data-poultry');
const grains   = getUnique(items, 'data-grain');

const pillBlocks = [
  { label: "Brand",   values: brands,   key: "data-brand" },
  { label: "Diet",    values: diets,    key: "data-diet" },
  { label: "Legumes", values: legumes,  key: "data-legumes" },
  { label: "Poultry", values: poultry,  key: "data-poultry" },
  { label: "Grain",   values: grains,   key: "data-grain" },
];

// --- Render Pills ---
function renderPills() {
  const pillWrap = document.getElementById('pwr-suggested-pills');
  pillWrap.innerHTML = '';
  pillBlocks.forEach(block => {
    block.values.forEach(val => {
      const pill = document.createElement('button');
      pill.className = 'pwr-pill';
      pill.type = 'button';
      pill.dataset.pillType = block.key;
      pill.dataset.pillValue = val;
      pill.textContent = `${val} (${block.label})`;
      pillWrap.appendChild(pill);
    });
  });
}
renderPills();

// --- Fuse Setup ---
const fuse = new Fuse(items, {
  keys: [
    "name", "data-one", "data-brand", "data-diet", "data-legumes", "data-poultry", "data-grain", "slug", "itemId"
  ],
  threshold: 0.36,
  includeScore: true,
});

// --- Trigger Definitions ---
const freeTriggers   = ["free", "without", "minus", "no"];
const brandTriggers  = ["brand", ...brands.map(x => x.toLowerCase())];

// --- Suggestion Logic ---
function getSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Brand filter
  const brandMatch = brands.find(b => q.includes(b.toLowerCase()));
  if (brandMatch) {
    return items.filter(x => (x['data-brand'] || '').toLowerCase() === brandMatch.toLowerCase());
  }

  // *Free logic (legumes, poultry, grain)
  if (freeTriggers.some(tr => q.includes(tr))) {
    if (q.includes('legume')) return items.filter(x => /(free|no|without)/.test(q) ? (x['data-legumes'] && /no|none|free|without/i.test(x['data-legumes'])) : true);
    if (q.includes('poultry')) return items.filter(x => /(free|no|without)/.test(q) ? (x['data-poultry'] && /no|none|free|without/i.test(x['data-poultry'])) : true);
    if (q.includes('grain'))   return items.filter(x => /(free|no|without)/.test(q) ? (x['data-grain'] && /no|none|free|without/i.test(x['data-grain'])) : true);
  }

  // Default: fuzzy name/diet search
  const results = fuse.search(q, { limit: 6 });
  return results.map(x => x.item);
}

// --- UI Bindings ---
const input  = document.getElementById('pwr-prompt-input');
const sugBox = document.getElementById('pwr-suggestions-list');

function renderSuggestions(suggestions) {
  sugBox.innerHTML = '';
  if (!suggestions.length) {
    sugBox.innerHTML = '<div class="pwr-suggest-none">No matches found.</div>';
    return;
  }
  suggestions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'pwr-suggestion-row';
    div.innerHTML = `
      <a href="https://www.sportdogfood.com/ci/${item.slug}" class="pwr-suggestion-link" target="_blank">
        <div class="pwr-suggestion-main">${item.name}</div>
        <div class="pwr-suggestion-meta">
          <span>${item['data-brand'] || ''}</span>
          <span>${item['data-diet'] || ''}</span>
        </div>
      </a>
    `;
    sugBox.appendChild(div);
  });
}

// --- Input Events ---
input.addEventListener('input', e => {
  const val = e.target.value;
  if (!val) {
    sugBox.innerHTML = '';
    return;
  }
  renderSuggestions(getSuggestions(val));
});

// --- Pill Clicks ---
document.getElementById('pwr-suggested-pills').addEventListener('click', e => {
  if (e.target.classList.contains('pwr-pill')) {
    const type = e.target.dataset.pillType;
    const value = e.target.dataset.pillValue;
    let matches = [];
    matches = items.filter(x => (x[type] || '').toLowerCase() === value.toLowerCase());
    renderSuggestions(matches);
  }
});

// --- Suggestion Clicks handled by <a> ---

console.log("[FCI] search-suggestions-fci.js initialized.");
