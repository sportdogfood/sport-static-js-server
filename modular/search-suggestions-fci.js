import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';

//--- Core Data & Indexing ---
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

function getUnique(arr, key) {
  return [...new Set(arr.map(x => (x[key] || '').trim()).filter(Boolean))];
}

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

//--- Fuse config ---
const fuse = new Fuse(items, {
  keys: [
    "name", "data-one", "data-brand", "data-diet", "data-legumes", "data-poultry", "data-grain", "slug", "itemId"
  ],
  threshold: 0.36,
  includeScore: true,
});

//--- Triggers
const freeTriggers = ["free", "without", "minus", "no"];
const brandTriggers = ["brand", ...brands.map(x => x.toLowerCase())];

//--- DOM refs (match markup) ---
const input    = document.getElementById('pwr-prompt-input');
const clearBtn = document.getElementById('pwr-clear-button');
const suggestionList = document.getElementById('pwr-suggestion-list');
const answerBox = document.getElementById('pwr-answer-output');
const answerTxt = document.getElementById('pwr-answer-text');
const answerClose = answerBox.querySelector('.pwr-answer-close');
const initialSuggestions = document.getElementById('pwr-initial-suggestions');

//--- Pills ---
function renderPills() {
  initialSuggestions.innerHTML = '';
  pillBlocks.forEach(block => {
    block.values.forEach(val => {
      const pill = document.createElement('button');
      pill.className = 'pwr-pill';
      pill.type = 'button';
      pill.dataset.pillType = block.key;
      pill.dataset.pillValue = val;
      pill.textContent = `${val}`;
      initialSuggestions.appendChild(pill);
    });
  });
  initialSuggestions.style.display = 'flex';
}
renderPills();

//--- Suggestion logic ---
function getSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const brandMatch = brands.find(b => q.includes(b.toLowerCase()));
  if (brandMatch) {
    return items.filter(x => (x['data-brand'] || '').toLowerCase() === brandMatch.toLowerCase());
  }
  if (freeTriggers.some(tr => q.includes(tr))) {
    if (q.includes('legume')) return items.filter(x => /(free|no|without)/.test(q) ? (x['data-legumes'] && /no|none|free|without/i.test(x['data-legumes'])) : true);
    if (q.includes('poultry')) return items.filter(x => /(free|no|without)/.test(q) ? (x['data-poultry'] && /no|none|free|without/i.test(x['data-poultry'])) : true);
    if (q.includes('grain'))   return items.filter(x => /(free|no|without)/.test(q) ? (x['data-grain'] && /no|none|free|without/i.test(x['data-grain'])) : true);
  }
  const results = fuse.search(q, { limit: 7 });
  return results.map(x => x.item);
}

//--- Render Suggestions as <ul><li>
function renderSuggestions(suggestions) {
  suggestionList.innerHTML = '';
  if (!suggestions.length) {
    suggestionList.innerHTML = `<li class="pwr-suggest-none">No matches found.</li>`;
    suggestionList.style.display = 'block';
    initialSuggestions.style.display = 'none';
    answerBox.style.display = 'none';
    return;
  }
  suggestions.forEach(item => {
    const li = document.createElement('li');
    li.className = 'pwr-suggestion-row';
    li.tabIndex = 0;
    li.innerHTML = `
      <span class="pwr-suggestion-main">${item.name}</span>
      <span class="pwr-suggestion-meta">
        ${item['data-brand'] ? `<span>${item['data-brand']}</span>` : ''}
        ${item['data-diet'] ? `<span>${item['data-diet']}</span>` : ''}
      </span>
    `;
    li.dataset.slug = item.slug;
    li.dataset.name = item.name;
    suggestionList.appendChild(li);
  });
  suggestionList.style.display = 'block';
  initialSuggestions.style.display = 'none';
  answerBox.style.display = 'none';
}

//--- UI/Answer logic
function showAnswer(text, link) {
  answerTxt.innerHTML = `<a href="${link}" target="_blank" rel="noopener">${text}</a>`;
  answerBox.style.display = 'block';
  suggestionList.style.display = 'none';
  initialSuggestions.style.display = 'none';
}
function resetAll() {
  input.value = '';
  updateButtons();
  answerBox.style.display = 'none';
  suggestionList.style.display = 'none';
  initialSuggestions.style.display = 'flex';
}

//--- Input triggers
function updateButtons() {
  const hasValue = !!input.value.trim();
  clearBtn.style.display = hasValue ? 'block' : 'none';
}
input.addEventListener('input', e => {
  updateButtons();
  const val = e.target.value;
  if (!val) {
    suggestionList.style.display = 'none';
    answerBox.style.display = 'none';
    initialSuggestions.style.display = 'flex';
    return;
  }
  const suggestions = getSuggestions(val);
  renderSuggestions(suggestions);
});

//--- Suggestion click (show answer)
suggestionList.addEventListener('click', e => {
  const li = e.target.closest('li.pwr-suggestion-row');
  if (!li) return;
  const name = li.dataset.name;
  const slug = li.dataset.slug;
  showAnswer(name, `https://www.sportdogfood.com/ci/${slug}`);
});
suggestionList.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const li = e.target.closest('li.pwr-suggestion-row');
    if (!li) return;
    const name = li.dataset.name;
    const slug = li.dataset.slug;
    showAnswer(name, `https://www.sportdogfood.com/ci/${slug}`);
  }
});

//--- Pill click (filter)
initialSuggestions.addEventListener('click', e => {
  if (e.target.classList.contains('pwr-pill')) {
    const type = e.target.dataset.pillType;
    const value = e.target.dataset.pillValue;
    let matches = items.filter(x => (x[type] || '').toLowerCase() === value.toLowerCase());
    renderSuggestions(matches);
  }
});

//--- Answer close/reset logic
if (clearBtn)    clearBtn.addEventListener('click', resetAll);
if (answerClose) answerClose.addEventListener('click', resetAll);

//--- Export for loader
export function initSearchSuggestions() {
  resetAll();
  // (Anything else needed to "boot" the module goes here)
}
