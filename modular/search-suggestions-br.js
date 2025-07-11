import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';
import { BRANDS } from './br.js';

// --- Get current brand data-five value from the DOM ---
const brandId = (document.getElementById('item-faq-five')?.value || '').trim();
const thisBrand = Object.values(BRANDS).find(b => String(b['data-five']) === brandId);

// --- Normalize CI Data for this brand only ---
const items = CI_DATA
  .filter(row => String(row["data-brand"]) === brandId)
  .map(row => ({
    name: row["Name"] || row["name"] || "",
    slug: row["Slug"] || row["slug"] || "",
    itemId: row["Item ID"] || row["itemId"] || "",
    dataFive: row["data-five"] || "",
    dataOne: row["data-one"] || "",
    dataBrand: row["data-brand"] || "",
    dataDiet: row["data-diet"] || "",
    dataLegumes: row["data-legumes"] || "",
    dataPoultry: row["data-poultry"] || "",
    dataGrain: row["data-grain"] || "",
    dataSort: row["data-sort"] || "",
  }));

// --- Prepare pills for this brand ---
const brandsArr = [thisBrand?.brandName || ''].filter(Boolean);
const diets   = [...new Set(items.map(x => x.dataDiet).filter(Boolean))];
const legumes = [...new Set(items.map(x => x.dataLegumes).filter(Boolean))];
const poultry = [...new Set(items.map(x => x.dataPoultry).filter(Boolean))];
const grains  = [...new Set(items.map(x => x.dataGrain).filter(Boolean))];

const pillBlocks = [
  { label: "Brand",   values: brandsArr, key: "dataBrand" },
  { label: "Diet",    values: diets,     key: "dataDiet" },
  { label: "Legumes", values: legumes,   key: "dataLegumes" },
  { label: "Poultry", values: poultry,   key: "dataPoultry" },
  { label: "Grain",   values: grains,    key: "dataGrain" },
];

const fuse = new Fuse(items, {
  keys: [
    "name", "dataOne", "dataBrand", "dataDiet", "dataLegumes", "dataPoultry", "dataGrain", "slug", "itemId"
  ],
  threshold: 0.36,
  includeScore: true,
});

const brandsByName = {};
if (thisBrand && thisBrand.brandName) {
  brandsByName[thisBrand.brandName.toLowerCase()] = thisBrand;
  if (thisBrand.keys) {
    thisBrand.keys.split(',').forEach(k => {
      brandsByName[k.trim().toLowerCase()] = thisBrand;
    });
  }
}

// --- DOM refs ---
const input    = document.getElementById('pwr-prompt-input');
const clearBtn = document.getElementById('pwr-clear-button');
const suggestionList = document.getElementById('pwr-suggestion-list');
const answerBox = document.getElementById('pwr-answer-output');
const answerTxt = document.getElementById('pwr-answer-text');
const answerClose = answerBox.querySelector('.pwr-answer-close');
const initialSuggestions = document.getElementById('pwr-initial-suggestions');

// --- Pills (SI style) ---
function renderPills() {
  initialSuggestions.innerHTML = '';
  pillBlocks.forEach(block => {
    block.values.forEach(val => {
      if (!val) return;
      const pill = document.createElement('button');
      pill.className = 'pwr-pill pwr-suggestion-pill';
      pill.type = 'button';
      pill.dataset.pillType = block.key;
      pill.dataset.pillValue = val;
      pill.textContent = val;
      initialSuggestions.appendChild(pill);
    });
  });
  initialSuggestions.style.display = 'flex';
  // Only show the pills row if there are pills
  const pillsRow = document.querySelector('.pwr-pills-row');
  if (pillsRow) {
    pillsRow.style.display = initialSuggestions.children.length ? 'flex' : 'none';
  }
}

// --- Get suggestions for this brand only ---
function getSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Only allow brandMatch if it matches this brand
  const brandMatch = brandsArr.find(b => q.includes(b.toLowerCase()));
  let main = [];
  if (brandMatch) {
    main = items.filter(x => (x.dataBrand || '').toLowerCase() === brandMatch.toLowerCase());
  } else {
    main = fuse.search(q, { limit: 8 }).map(x => x.item);
  }
  // Add brand link for this brand only
  let brandLink = null;
  if (brandMatch && brandsByName[brandMatch.toLowerCase()]) {
    brandLink = brandsByName[brandMatch.toLowerCase()];
  } else {
    for (const key in brandsByName) {
      if (q === key || q.includes(key)) {
        brandLink = brandsByName[key];
        break;
      }
    }
  }
  if (brandLink) {
    main.push({ _brand: true, ...brandLink });
  }
  return main;
}

// --- Format suggestion label per requirements ---
function formatSuggestion(item) {
  return `${item.dataOne} by ${item.dataBrand} <span class="pwr-suggest-diet">${item.dataDiet}</span>`;
}

function renderSuggestions(suggestions) {
  suggestionList.innerHTML = '';
  const pillsRow = document.querySelector('.pwr-pills-row');
  if (!suggestions.length) {
    suggestionList.innerHTML = `<li class="pwr-suggest-none">No matches found.</li>`;
    suggestionList.style.display = 'block';
    initialSuggestions.style.display = 'none';
    answerBox.style.display = 'none';
    if (pillsRow) pillsRow.style.display = 'none';
    return;
  }
  suggestions.forEach(item => {
    const li = document.createElement('li');
    li.className = 'pwr-suggestion-row';
    li.tabIndex = 0;
    if (item._brand) {
      li.innerHTML = `<span class="pwr-suggestion-main">See all <b>${item.brandName}</b> foods</span>
        <span class="pwr-suggestion-meta">Brand page</span>`;
      li.dataset.brandslug = item.Slug || item.slug;
      li.dataset.brand = item.brandName;
      li.dataset.type = "brand";
    } else {
      li.innerHTML = `<span class="pwr-suggestion-main">${formatSuggestion(item)}</span>`;
      li.dataset.slug = item.slug;
      li.dataset.name = item.name;
      li.dataset.type = "ci";
      li.dataset.inputValue = `${item.dataOne} by ${item.dataBrand}`;
      li.dataset.fullValue = formatSuggestion(item);
      li.dataset.ciBrand = item.dataBrand;
      li.dataset.ciDiet = item.dataDiet;
    }
    suggestionList.appendChild(li);
  });
  suggestionList.style.display = 'block';
  initialSuggestions.style.display = 'none';
  answerBox.style.display = 'none';
  if (pillsRow) pillsRow.style.display = 'none';
}

function showAnswer(text, link) {
  answerTxt.innerHTML = `<a href="${link}" target="_blank" rel="noopener" style="font-size:1rem;display:inline-flex;align-items:center;">
    ${text}
    <svg style="margin-left:0.42em;width:1.22em;height:1.22em;vertical-align:-0.18em;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10"/></svg>
    </a>`;
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
  const pillsRow = document.querySelector('.pwr-pills-row');
  if (pillsRow) pillsRow.style.display = 'flex';
}

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
    const pillsRow = document.querySelector('.pwr-pills-row');
    if (pillsRow) pillsRow.style.display = 'flex';
    return;
  }
  const suggestions = getSuggestions(val);
  renderSuggestions(suggestions);
});

suggestionList.addEventListener('click', e => {
  const li = e.target.closest('li.pwr-suggestion-row');
  if (!li) return;
  if (li.dataset.type === "brand" && li.dataset.brandslug) {
    input.value = `All ${li.dataset.brand} foods`;
    updateButtons();
    showAnswer(`All ${li.dataset.brand} foods`, `https://www.sportdogfood.com/brands/${li.dataset.brandslug}`);
    return;
  }
  if (li.dataset.type === "ci" && li.dataset.name && li.dataset.slug) {
    const inputVal = li.dataset.inputValue || li.textContent || '';
    input.value = inputVal;
    updateButtons();
    showAnswer(li.dataset.name, `https://www.sportdogfood.com/ci/${li.dataset.slug}`);
  }
});
suggestionList.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const li = e.target.closest('li.pwr-suggestion-row');
    if (!li) return;
    if (li.dataset.type === "brand" && li.dataset.brandslug) {
      input.value = `All ${li.dataset.brand} foods`;
      updateButtons();
      showAnswer(`All ${li.dataset.brand} foods`, `https://www.sportdogfood.com/brands/${li.dataset.brandslug}`);
      return;
    }
    if (li.dataset.type === "ci" && li.dataset.name && li.dataset.slug) {
      const inputVal = li.dataset.inputValue || li.textContent || '';
      input.value = inputVal;
      updateButtons();
      showAnswer(li.dataset.name, `https://www.sportdogfood.com/ci/${li.dataset.slug}`);
    }
  }
});

initialSuggestions.addEventListener('click', e => {
  if (e.target.classList.contains('pwr-pill')) {
    e.preventDefault();
    const value = e.target.dataset.pillValue;
    input.value = value;
    updateButtons();
    const suggestions = getSuggestions(value);
    renderSuggestions(suggestions);
    const ciSuggestions = suggestions.filter(x => !x._brand);
    if (ciSuggestions.length === 1) {
      showAnswer(ciSuggestions[0].name, `https://www.sportdogfood.com/ci/${ciSuggestions[0].slug}`);
    }
  }
});

if (clearBtn)    clearBtn.addEventListener('click', resetAll);
if (answerClose) answerClose.addEventListener('click', resetAll);

export function initSearchSuggestions() {
  renderPills();
  resetAll();
}
