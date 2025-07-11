import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';
import { BRANDS } from './br.js';

// --- Normalize CI Data & Filter out Sport Dog Food brand (data-brand "1000") ---
const items = CI_DATA
  .filter(row => String(row["data-brand"]) !== "1000")
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

// --- Prepare brands for pills (exclude Sport Dog Food, data-five "1000") ---
const brandsArr = Array.isArray(items)
  ? [...new Set(items.map(x => x.dataBrand).filter(b => b && b !== 'Sport Dog Food'))]
  : [];
const diets   = [...new Set(items.map(x => x.dataDiet).filter(Boolean))];
const legumes = [...new Set(items.map(x => x.dataLegumes).filter(Boolean))];
const poultry = [...new Set(items.map(x => x.dataPoultry).filter(Boolean))];
const grains  = [...new Set(items.map(x => x.dataGrain).filter(Boolean))];

// --- Pills config ---
const pillBlocks = [
  { label: "Brand",   values: brandsArr, key: "dataBrand" },
  { label: "Diet",    values: diets,     key: "dataDiet" },
  { label: "Legumes", values: legumes,   key: "dataLegumes" },
  { label: "Poultry", values: poultry,   key: "dataPoultry" },
  { label: "Grain",   values: grains,    key: "dataGrain" },
];

// --- Fuse config for fuzzy search ---
const fuse = new Fuse(items, {
  keys: [
    "name", "dataOne", "dataBrand", "dataDiet", "dataLegumes", "dataPoultry", "dataGrain", "slug", "itemId"
  ],
  threshold: 0.36,
  includeScore: true,
});

// --- Brand lookup by lower-case keys (exclude Sport Dog Food) ---
const brandsByName = {};
Object.values(BRANDS).forEach(b => {
  if (b["brandName"] && b["brandName"] !== "Sport Dog Food" && String(b["data-five"]) !== "1000") {
    brandsByName[b["brandName"].toLowerCase()] = b;
    if (b.keys) {
      b.keys.split(',').forEach(k => {
        brandsByName[k.trim().toLowerCase()] = b;
      });
    }
  }
});

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
  // Always show the pills row
  const pillsRow = document.querySelector('.pwr-pills-row');
  if (pillsRow) pillsRow.style.display = 'flex';
}

// --- Get suggestions + brand link logic ---
function getSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const brandMatch = brandsArr.find(b => q.includes(b.toLowerCase()));
  let main = [];
  if (brandMatch) {
    main = items.filter(x => (x.dataBrand || '').toLowerCase() === brandMatch.toLowerCase());
  } else {
    main = fuse.search(q, { limit: 8 }).map(x => x.item);
  }
  // Add brand link if found and not SDF
  let brandLink = null;
  if (brandMatch && brandsByName[brandMatch.toLowerCase()]) {
    brandLink = brandsByName[brandMatch.toLowerCase()];
  } else {
    for (const key in brandsByName) {
      if (q === key || q.includes(key)) {
        if (brandsByName[key] && brandsByName[key].brandName !== "Sport Dog Food") {
          brandLink = brandsByName[key];
          break;
        }
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
  return `${item.dataOne} by ${item.dataBrand} <span>${item.dataDiet}</span>`;
}

// --- Render Suggestions as <ul><li> (includes brand link if present) ---
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
    if (item._brand) {
      li.innerHTML = `<span class="pwr-suggestion-main">See all <b>${item.brandName}</b> foods</span>
        <span class="pwr-suggestion-meta">Brand page</span>`;
      li.dataset.brandslug = item.Slug || item.slug;
      li.dataset.brand = item.brandName;
      li.dataset.type = "brand";
    } else {
      // Use new format for suggested question
      li.innerHTML = `<span class="pwr-suggestion-main">${formatSuggestion(item)}</span>`;
      li.dataset.slug = item.slug;
      li.dataset.name = item.name;
      li.dataset.type = "ci";
      li.dataset.inputValue = `${item.dataOne} by ${item.dataBrand}`; // for input fill (exclude HTML tags)
      li.dataset.fullValue = formatSuggestion(item); // full HTML for display, plain for input
      li.dataset.ciBrand = item.dataBrand;
      li.dataset.ciDiet = item.dataDiet;
    }
    suggestionList.appendChild(li);
  });
  suggestionList.style.display = 'block';
  initialSuggestions.style.display = 'none';
  answerBox.style.display = 'none';
}

// --- UI/Answer logic with arrow-up-right and font-size 1rem ---
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

// --- Input triggers
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

// --- Suggestion click (fill input, show answer) ---
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
    // Fill input with formatted suggestion (text only)
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

// --- Pill click (copy to input, trigger filter, show answer if one) ---
initialSuggestions.addEventListener('click', e => {
  if (e.target.classList.contains('pwr-pill')) {
    e.preventDefault();
    const value = e.target.dataset.pillValue;
    input.value = value;
    updateButtons();
    const suggestions = getSuggestions(value);
    renderSuggestions(suggestions);
    // Auto-answer if exactly one (non-brand) CI result
    const ciSuggestions = suggestions.filter(x => !x._brand);
    if (ciSuggestions.length === 1) {
      showAnswer(ciSuggestions[0].name, `https://www.sportdogfood.com/ci/${ciSuggestions[0].slug}`);
    }
  }
});

// --- Answer close/reset logic
if (clearBtn)    clearBtn.addEventListener('click', resetAll);
if (answerClose) answerClose.addEventListener('click', resetAll);

// --- Export for loader
export function initSearchSuggestions() {
  renderPills();
  resetAll();
}
// --- Consolidated Pills Row Scroll/Arrow/Drag Logic ---
document.addEventListener("DOMContentLoaded", function() {
  const menu = document.getElementById('pwr-initial-suggestions');
  const prev = document.querySelector('.pwr-arrow-prev');
  const next = document.querySelector('.pwr-arrow-next');
  const pillsRow = document.querySelector('.pwr-pills-row');

  // Helper: Show/hide arrows if pills overflow
  function updateArrows() {
    if (!menu || !prev || !next) return;
    // Pills overflow horizontally?
    const overflow = menu.scrollWidth > menu.clientWidth + 10;
    prev.style.display = overflow ? 'flex' : 'none';
    next.style.display = overflow ? 'flex' : 'none';
  }
  // Helper: Show/hide pills row if pills present
  function updatePillsRowDisplay() {
    if (!pillsRow || !menu) return;
    const pills = menu.querySelectorAll('.pwr-suggestion-pill');
    pillsRow.style.display = (pills.length > 0) ? 'flex' : 'none';
    updateArrows();
  }
  // Initial check
  updatePillsRowDisplay();

  // React to any changes in pills (for dynamic modules)
  new MutationObserver(updatePillsRowDisplay).observe(menu, {childList: true, subtree: false});

  // Arrow click scroll
  function getScrollAmount() {
    const pill = menu.querySelector('.pwr-suggestion-pill');
    return pill ? pill.offsetWidth + 12 : 120;
  }
  if (prev) prev.addEventListener('click', () => menu.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
  if (next) next.addEventListener('click', () => menu.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));

  // Drag to scroll (mouse and touch)
  let isDown = false, startX, scrollLeft;

  menu.addEventListener('mousedown', function(e) {
    isDown = true;
    menu.classList.add('dragging');
    startX = e.pageX - menu.offsetLeft;
    scrollLeft = menu.scrollLeft;
  });
  menu.addEventListener('mouseleave', function() {
    isDown = false;
    menu.classList.remove('dragging');
  });
  menu.addEventListener('mouseup', function() {
    isDown = false;
    menu.classList.remove('dragging');
  });
  menu.addEventListener('mousemove', function(e) {
    if (!isDown) return;
    e.preventDefault();
    var x = e.pageX - menu.offsetLeft;
    var walk = (x - startX) * 1.5;
    menu.scrollLeft = scrollLeft - walk;
  });
  // Mobile touch support
  menu.addEventListener('touchstart', function(e) {
    isDown = true;
    startX = e.touches[0].pageX - menu.offsetLeft;
    scrollLeft = menu.scrollLeft;
  });
  menu.addEventListener('touchend', function() {
    isDown = false;
    menu.classList.remove('dragging');
  });
  menu.addEventListener('touchmove', function(e) {
    if (!isDown) return;
    var x = e.touches[0].pageX - menu.offsetLeft;
    var walk = (x - startX) * 1.3;
    menu.scrollLeft = scrollLeft - walk;
  });

  // Re-run on pills show/reset (optional, if called externally)
  document.addEventListener('FCI_PILLS_UPDATE', updatePillsRowDisplay);
});
