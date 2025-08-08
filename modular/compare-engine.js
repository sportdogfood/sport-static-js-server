import { CI_DATA }   from './ci.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';
// Typed.js is loaded via your page’s <script> include

// ── Persistent background-lazy observer ──
const bgObserver = ('IntersectionObserver' in window)
  ? new IntersectionObserver((entries, obs) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        const url = target.dataset.bg;
        if (url) {
          target.style.backgroundImage    = `url("${url}")`;
          target.style.backgroundSize     = 'cover';
          target.style.backgroundPosition = 'center';
          target.classList.remove('lazy-bg');
          obs.unobserve(target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -30% 0px', threshold: 0 })
  : null;

// ── Helper to defer preview-image loading ──
function setLazyBackground(el, url) {
  if (!el) {
    console.warn('[lazy] setLazyBackground: element is null');
    return;
  }
  if (!url) {
    console.warn('[lazy] setLazyBackground: no URL for', el);
    return;
  }
  console.log('[lazy] setting data-bg on', el, '→', url);
  el.dataset.bg = url;
  if (bgObserver) {
    bgObserver.observe(el);
  } else {
    // fallback: load immediately
    el.style.backgroundImage    = `url("${url}")`;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
    el.classList.remove('lazy-bg');
  }
}


export function paintCompareShell({
  containerSelector = '.pwr-section-container',
  brand = 'the competition',
  inputPresets = [
    "Type: Purina Pro Plan",
    "Try: Grain Free"
  ]
} = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="pwr-outer-shell">
      <div class="pwr-search-title">
        <div class="pwrs-subtitle-wrapper pwrs-btn-noshrink">
          <div class="pwr-btn-txt-2 descption-none-4">Compare brands</div>
        </div>
        <div id="pwr-fake-label" class="pwr-fake-label">
          See how our diets outwork <span class="brand-highlight">${brand}</span>
        </div>
        <div id="pwr-search-subtitle" class="pwr-search-subtitle">
          <div>Pick a brand to compare against Sport Dog Food.</div>
        </div>
      </div>
      <div class="pwr-chat-markup-wrapper">
        <div class="chat-markeup w-embed">
          <div class="pwr-chat-content">
            <div class="pwr-search-input-bar">
              <input id="pwr-prompt-input" class="pwr-search-input" type="text" placeholder="${inputPresets[0]}" autocomplete="off">
              <button id="pwr-clear-button" class="pwr-clear-button" aria-label="Clear input" style="display: none;">×</button>
            </div>
            <div class="pwr-pills-row" style="display: flex;">
              <button class="pwr-arrow pwr-arrow-prev" aria-label="Scroll left" tabindex="0">&lt;</button>
              <div id="pwr-initial-suggestions" class="pwr-starter-menu" style="display: flex;"></div>
              <button class="pwr-arrow pwr-arrow-next" aria-label="Scroll right" tabindex="0">&gt;</button>
            </div>
            <ul id="pwr-suggestion-list" class="pwr-suggestion-list" style="display: none;"></ul>
            <div id="pwr-answer-output" class="pwr-answer-output" style="display:none;">
              <button class="pwr-answer-close" aria-label="Close answer">×</button>
              <div class="pwr-answer-output-flex">
                <span id="pwr-answer-text" class="pwr-answer-text"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Randomize hero label
  const heroPresets = [
    `See how our diets outwork <span class='brand-highlight'>${brand}</span>`,
    `Discover what sets us apart from <span class='brand-highlight'>${brand}</span>`
  ];
  const label = container.querySelector('#pwr-fake-label');
  if (label) {
    label.innerHTML = heroPresets[Math.floor(Math.random() * heroPresets.length)];
  }

  // Rotate input placeholders
  const input = container.querySelector('#pwr-prompt-input');
  let i = 0;
  if (input && inputPresets.length > 1) {
    setInterval(() => {
      i = (i + 1) % inputPresets.length;
      input.placeholder = inputPresets[i];
    }, 4000);
  }
}

const SDF_FORMULAS = {
  cub:     "29280",
  dock:    "29099",
  herding: "28979"
};
const ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

function getSdfFormula(row) {
  if (!row) return SDF_FORMULAS.dock;
  if ((row["data-grain"] || "").toLowerCase().includes("grain free")) return SDF_FORMULAS.herding;
  if (+row["ga_kcals_per_cup"] > 490) return SDF_FORMULAS.cub;
  return SDF_FORMULAS.dock;
}

function getCiRow(dataFive) {
  return CI_DATA.find(row => String(row["data-five"]) === String(dataFive));
}

function joinWithAnd(arr) {
  if (arr.length <= 1) return arr.join('');
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + " and " + arr.slice(-1);
}

/**
 * Returns a combined legume/poultry phrase handling all 4 states:
 *  - both free
 *  - both contain
 *  - legume-free but contains poultry
 *  - poultry-free but contains legumes
 */

/**
 * Utility: Adds a data-driven class to an element based on value
 * @param {Element} el - DOM element to update
 * @param {string} base - class prefix, e.g. "brand-1" or "sport-1"
 * @param {string} key - subkey, e.g. "flavor", "diet", "legumesfree", "poultryfree"
 * @param {string} value - value to drive the class
 * @param {Object} map - value translation map

/**
 * Returns a combined legume/poultry phrase handling all 4 states
 */
function buildLegumePoultryPhrase(row) {
  const vL = (row["data-legumes"] || "").toLowerCase();
  const vP = (row["data-poultry"] || "").toLowerCase();
  const freeL = vL.includes("free") || vL.includes("no");
  const freeP = vP.includes("free") || vP.includes("no");
  const legumePhrase  = freeL ? "legume-free"      : "contains legumes";
  const poultryPhrase = freeP ? "poultry-free"     : "contains poultry";
  if (freeL && freeP)      return `${legumePhrase} and ${poultryPhrase}`;
  if (!freeL && !freeP)    return `${legumePhrase} and ${poultryPhrase}`;
  if (freeL && !freeP)     return `${legumePhrase} but ${poultryPhrase}`;
  /* !freeL && freeP */    return `${poultryPhrase} but ${legumePhrase}`;
}

/**
 * Renders six normalized nutrient bars into
 * <div id="nutrient-bars-container"></div>
 */
function renderNutrientBars(mainRow, sdfRow) {
  const container = document.getElementById('nutrient-bars-container');
  if (!container) return;

  // Your visual‐scale maxima
  const MAX = { protein: 40, fat: 30, kcals: 600 };

  // Helper: always at least 2% wide
  const pct = (val, max) => Math.max(2, Math.round((val / max) * 100));

  // Pull and coerce row values
  const mp = Number(mainRow["ga_crude_protein_%"])  || 0;
  const mf = Number(mainRow["ga_crude_fat_%"])      || 0;
  const mk = Number(mainRow["ga_kcals_per_cup"])    || 0;
  const sp = Number(sdfRow["ga_crude_protein_%"])   || 0;
  const sf = Number(sdfRow["ga_crude_fat_%"])       || 0;
  const sk = Number(sdfRow["ga_kcals_per_cup"])     || 0;

  // Build all six rows of HTML
  container.innerHTML = `
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Brand Protein</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(mp,MAX.protein)}%"></div>
      </div>
      <span class="nutrient-bar-value">${mp}%</span>
    </div>
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Brand Fat</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(mf,MAX.fat)}%"></div>
      </div>
      <span class="nutrient-bar-value">${mf}%</span>
    </div>
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Brand Calories</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(mk,MAX.kcals)}%"></div>
      </div>
      <span class="nutrient-bar-value">${mk}</span>
    </div>
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Sport Protein</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(sp,MAX.protein)}%"></div>
      </div>
      <span class="nutrient-bar-value">${sp}%</span>
    </div>
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Sport Fat</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(sf,MAX.fat)}%"></div>
      </div>
      <span class="nutrient-bar-value">${sf}%</span>
    </div>
    <div class="nutrient-bar-row">
      <span class="nutrient-bar-label">Sport Calories</span>
      <div class="nutrient-bar-track">
        <div class="nutrient-bar-fill" style="width:${pct(sk,MAX.kcals)}%"></div>
      </div>
      <span class="nutrient-bar-value">${sk}</span>
    </div>
  `;
}


function setDataClass(el, base, key, value, map) {
  if (!el) return;
  // Remove any previous class like brand-1-flavor-*
  const re = new RegExp(`\\b${base}-${key}-\\w+\\b`, 'g');
  el.className = el.className.replace(re, '').trim();

  // Normalize value: find exact key case-insensitively in map
  let segmentKey = Object.keys(map).find(k => k.toLowerCase() === (value || '').toLowerCase());
  let segment = segmentKey ? map[segmentKey] : (value || '').toLowerCase().replace(/\s+/g, '');

  if (segment) el.classList.add(`${base}-${key}-${segment}`);
}

function showInnerByValue(container, value, map) {
  if (!container) return;
  const targetClass = map[value] || null;

  // Hide all inner divs first
  container.querySelectorAll('.pwr8-inner').forEach(div => {
    div.classList.remove('show');
  });

  // Show the one that matches the mapped class
  if (targetClass) {
    const toShow = container.querySelector(`.pwr8-inner.${targetClass}`);
    if (toShow) toShow.classList.add('show');
  }
}


function paintSection1(mainRow, sdfRow) {
  const CDN = "https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41";

  // (Keep header/subtitle wiring, or strip—your call)
  const headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Nutrition Profile";
  const subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) {
    subtitleEl.innerHTML =
      `<span class="span-compare">Comparing</span><br>` +
      `${mainRow["data-brand"]} ${mainRow["data-one"]}<br>` +
      `<img src="${CDN}/688bad97d808a1d5e76a8eb2_versus.svg" alt="versus" class="vs-icon" style="vertical-align:middle; width:1.6em; height:1em; margin:0 0.3em;"><br>` +
      `Sport Dog Food ${sdfRow["data-one"]}`;
  }

  const dietText = v =>
    /free/i.test(v) ? 'Grain Free' : /grain/i.test(v) ? 'Grain Inclusive' : '—';
  const legumesText = v =>
    /(free|no)/i.test(v) ? 'Legume-Free' : /legume|pea/i.test(v) ? 'Contains Legumes' : '—';
  const poultryText = v =>
    /(free|no)/i.test(v) ? 'Poultry-Free' : /poultry|chicken/i.test(v) ? 'Contains Poultry' : '—';
  const flavorText = v =>
    /\b(chicken|poultry)\b/i.test(v) ? 'Poultry' :
    /\bbeef\b/i.test(v) ? 'Beef' :
    /\bfish|salmon\b/i.test(v) ? 'Fish' :
    /\bbison|buffalo\b/i.test(v) ? 'Buffalo' :
    /\bmeat\b/i.test(v) ? 'Meat' : '—';

  const setDelta = (a, b) => a === b ? {text:'Match'} : {text:'Different'};

  const root = document.querySelector('#section-1 .cmp1-rows');
  if (!root) return;

  const rows = [
    {
      key:'diet', label:'Diet',
      brand: dietText(mainRow["data-diet"] || mainRow["data-grain"] || ''),
      sport: dietText(sdfRow["data-diet"]  || sdfRow["data-grain"]  || '')
    },
    {
      key:'legumes', label:'Legumes',
      brand: legumesText(mainRow["data-legumes"] || ''),
      sport: legumesText(sdfRow["data-legumes"]  || '')
    },
    {
      key:'poultry', label:'Poultry',
      brand: poultryText(mainRow["data-poultry"] || ''),
      sport: poultryText(sdfRow["data-poultry"]  || '')
    },
    {
      key:'flavor', label:'Primary Protein',
      brand: flavorText(mainRow["specs_primary_flavor"] || ''),
      sport: flavorText(sdfRow["specs_primary_flavor"]  || '')
    }
  ];

  root.innerHTML = rows.map(r => `
    <div class="cmp1-row" data-key="${r.key}">
      <div class="cmp1-label">${r.label}</div>
      <div class="cmp1-values">
        <span class="cmp1-badge brand">${r.brand}</span>
        <span class="cmp1-badge sport">${r.sport}</span>
      </div>
      <div class="cmp1-delta">${setDelta(r.brand, r.sport).text}</div>
    </div>
  `).join('');
}

function renderStickyCompareHeader(mainRow, sdfRow) {
  const root = document.getElementById('compare-sticky');
  if (!root) return;

  // Inject structure once
  if (!root.querySelector('.cmp-head')) {
    root.innerHTML = `
      <div class="cmp-head">
        <div class="cmp-head-col brand">
          <div class="cmp-head-img lazy-bg" data-var="compare-1-preview"></div>
          <div class="cmp-head-meta">
            <div class="cmp-head-brand" data-var="compare-1-brand"></div>
            <div class="cmp-head-name"  data-var="compare-1-name"></div>
          </div>
        </div>
        <div class="cmp-head-col sport">
          <div class="cmp-head-img lazy-bg" data-var="sport-1-previewimg"></div>
          <div class="cmp-head-meta">
            <div class="cmp-head-brand" data-var="sport-1-brand"></div>
            <div class="cmp-head-name"  data-var="sport-1-name"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Fill text
  const set = (sel, v) => {
    const el = root.querySelector(`[data-var="${sel}"]`);
    if (el) el.textContent = v || '';
  };
  set('compare-1-brand', mainRow['data-brand']);
  set('compare-1-name',  mainRow['data-one']);
  set('sport-1-brand',   'Sport Dog Food');
  set('sport-1-name',    sdfRow['data-one']);

  // Lazy images (reuse your helper)
  const bImg = root.querySelector('[data-var="compare-1-preview"]');
  const sImg = root.querySelector('[data-var="sport-1-previewimg"]');
  if (bImg && mainRow.previewengine) setLazyBackground(bImg, mainRow.previewengine);
  if (sImg && sdfRow.previewengine)  setLazyBackground(sImg,  sdfRow.previewengine);
}


function paintSection1(mainRow, sdfRow) {
  const CDN = "https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41";

  // (Keep header/subtitle wiring, or strip—your call)
  const headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Nutrition Profile";
  const subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) {
    subtitleEl.innerHTML =
      `<span class="span-compare">Comparing</span><br>` +
      `${mainRow["data-brand"]} ${mainRow["data-one"]}<br>` +
      `<img src="${CDN}/688bad97d808a1d5e76a8eb2_versus.svg" alt="versus" class="vs-icon" style="vertical-align:middle; width:1.6em; height:1em; margin:0 0.3em;"><br>` +
      `Sport Dog Food ${sdfRow["data-one"]}`;
  }

  const dietText = v =>
    /free/i.test(v) ? 'Grain Free' : /grain/i.test(v) ? 'Grain Inclusive' : '—';
  const legumesText = v =>
    /(free|no)/i.test(v) ? 'Legume-Free' : /legume|pea/i.test(v) ? 'Contains Legumes' : '—';
  const poultryText = v =>
    /(free|no)/i.test(v) ? 'Poultry-Free' : /poultry|chicken/i.test(v) ? 'Contains Poultry' : '—';
  const flavorText = v =>
    /\b(chicken|poultry)\b/i.test(v) ? 'Poultry' :
    /\bbeef\b/i.test(v) ? 'Beef' :
    /\bfish|salmon\b/i.test(v) ? 'Fish' :
    /\bbison|buffalo\b/i.test(v) ? 'Buffalo' :
    /\bmeat\b/i.test(v) ? 'Meat' : '—';

  const setDelta = (a, b) => a === b ? {text:'Match'} : {text:'Different'};

  const root = document.querySelector('#section-1 .cmp1-rows');
  if (!root) return;

  const rows = [
    {
      key:'diet', label:'Diet',
      brand: dietText(mainRow["data-diet"] || mainRow["data-grain"] || ''),
      sport: dietText(sdfRow["data-diet"]  || sdfRow["data-grain"]  || '')
    },
    {
      key:'legumes', label:'Legumes',
      brand: legumesText(mainRow["data-legumes"] || ''),
      sport: legumesText(sdfRow["data-legumes"]  || '')
    },
    {
      key:'poultry', label:'Poultry',
      brand: poultryText(mainRow["data-poultry"] || ''),
      sport: poultryText(sdfRow["data-poultry"]  || '')
    },
    {
      key:'flavor', label:'Primary Protein',
      brand: flavorText(mainRow["specs_primary_flavor"] || ''),
      sport: flavorText(sdfRow["specs_primary_flavor"]  || '')
    }
  ];

  root.innerHTML = rows.map(r => `
    <div class="cmp1-row" data-key="${r.key}">
      <div class="cmp1-label">${r.label}</div>
      <div class="cmp1-values">
        <span class="cmp1-badge brand">${r.brand}</span>
        <span class="cmp1-badge sport">${r.sport}</span>
      </div>
      <div class="cmp1-delta">${setDelta(r.brand, r.sport).text}</div>
    </div>
  `).join('');
}



function paintSection3(mainRow, sdfRow) {
  // ---- Headline & subtitle ----
  const headerEl = document.querySelector('[data-var="section3-header"]');
  if (headerEl) headerEl.textContent = "Under the Hood";
  const subtitleEl = document.querySelector('[data-var="section3-subtitle"]');
  if (subtitleEl) subtitleEl.textContent = "Let's dig in and see how each ingredient stacks up.";

  // ---- Root for Section 3 ----
  const sec3 = document.getElementById('section-3') || document.querySelector('#section-3');
  if (!sec3) return;

  // ---- Build scaffold once ----
  if (!sec3.querySelector('.cmp3')) {
    sec3.innerHTML = `
      <div class="cmp3">
        <!-- Totals overlay -->
        <div class="cmp3-rows" id="cmp3-rows"></div>

        <!-- Actions -->
        <div class="cmp3-actions">
          <button class="cmp3-btn" id="open-ing-search">Search ingredients</button>
          <button class="cmp3-btn" id="swap-ing-order" aria-pressed="false">Swap order (Sport ⇄ Compare)</button>
        </div>

        <!-- Ingredient lists: compare over sport -->
        <div class="cmp3-lists" id="cmp3-lists">
          <div class="ci-list brand" id="cmp3-brand-list">
            <div class="ci-list-head" data-var="brand-1-sec3-name"></div>
            <div class="ci-list-body" data-var="brand-1-sec3-inglist"></div>
          </div>
          <div class="ci-list sport" id="cmp3-sport-list">
            <div class="ci-list-head" data-var="sport-1-sec3-name"></div>
            <div class="ci-list-body" data-var="sport-1-sec3-inglist"></div>
          </div>
        </div>
      </div>
    `;
  }

  // ---- Totals overlay rows (compare over sport) ----
  const rowsRoot = sec3.querySelector('#cmp3-rows');
  const countsBrand = getIngredientCategoryCounts(mainRow);
  const countsSport = getIngredientCategoryCounts(sdfRow);
  const overlayRow = (key, label) => {
    const b = countsBrand[key] ?? 0;
    const s = countsSport[key] ?? 0;
    const diff = s - b;
    const diffTxt = diff === 0 ? '±0' : (diff > 0 ? `+${diff}` : `${diff}`);
    const badge = diff === 0 ? 'Match' : 'Different';
    const badgeCls = diff === 0 ? 'match' : 'diff';
    return `
      <div class="cmp3-row" data-key="${key}">
        <div class="cmp3-label">${label}</div>
        <div class="cmp3-values">
          <span class="cmp3-badge brand">${b}</span>
          <span class="cmp3-badge sport">${s}</span>
        </div>
        <div class="cmp3-diff">${diffTxt}</div>
        <div class="cmp3-delta ${badgeCls}">${badge}</div>
      </div>
    `;
  };

  rowsRoot.innerHTML = [
    overlayRow('total',       'Total Ingredients'),
    overlayRow('Protein',     'Protein'),
    overlayRow('Plants',      'Plants'),
    overlayRow('Supplemental','Supplemental'),
    (countsBrand.Other || countsSport.Other) ? overlayRow('Other', 'Other') : ''
  ].join('');

  // ---- Names above lists ----
  const brandNameEl = sec3.querySelector('[data-var="brand-1-sec3-name"]');
  if (brandNameEl) brandNameEl.textContent =
    mainRow["data-brand"] ? `${mainRow["data-brand"]} ${mainRow["data-one"] || ''}`.trim()
                          : (mainRow["data-one"] || "");

  const sportNameEl = sec3.querySelector('[data-var="sport-1-sec3-name"]');
  if (sportNameEl) sportNameEl.textContent = `Sport Dog Food ${sdfRow["data-one"] || ''}`.trim();

  // ---- Ingredient lists ----
  const brandListEl = sec3.querySelector('[data-var="brand-1-sec3-inglist"]');
  if (brandListEl) brandListEl.innerHTML = renderIngListDivs(mainRow);
  const sportListEl = sec3.querySelector('[data-var="sport-1-sec3-inglist"]');
  if (sportListEl) sportListEl.innerHTML = renderIngListDivs(sdfRow);

  // ---- Modal: ensure exists + wire open/close + paint search UI inside ----
  ensureIngSearchModal();
  const openBtn = sec3.querySelector('#open-ing-search');
  if (openBtn && !openBtn._wired) {
    openBtn._wired = true;
    openBtn.addEventListener('click', () => {
      const modal = document.getElementById('ing-search-modal');
      if (!modal) return;
      modal.classList.add('open');
      // Paint the dual ingredient search into the modal’s .pwrf-filter-wrapper
      paintDualIngredientLists(mainRow, sdfRow);
    });
  }

  // ---- Swap order toggle (Sport ⇄ Compare) ----
  const swapBtn   = sec3.querySelector('#swap-ing-order');
  const listsWrap = sec3.querySelector('#cmp3-lists');
  const brandBlock = sec3.querySelector('#cmp3-brand-list');
  const sportBlock = sec3.querySelector('#cmp3-sport-list');

  if (swapBtn && !swapBtn._wired) {
    swapBtn._wired = true;
    swapBtn.addEventListener('click', () => {
      const swapped = swapBtn.getAttribute('aria-pressed') === 'true';
      swapBtn.setAttribute('aria-pressed', String(!swapped));
      if (!swapped) {
        // Move sport above compare
        if (sportBlock && listsWrap) listsWrap.insertBefore(sportBlock, brandBlock);
      } else {
        // Move compare back on top
        if (brandBlock && listsWrap) listsWrap.insertBefore(brandBlock, sportBlock);
      }
    });
  }
} // <-- END paintSection3

function ensureIngSearchModal() {
  if (document.getElementById('ing-search-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'ing-search-modal';
  modal.className = 'cmp3-modal';
  modal.innerHTML = `
    <div class="cmp3-modal__backdrop" data-close="1"></div>
    <div class="cmp3-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ing-search-title">
      <div class="cmp3-modal__head">
        <h3 id="ing-search-title">Search Ingredients</h3>
        <button class="cmp3-btn cmp3-modal__close" data-close="1" aria-label="Close">×</button>
      </div>
      <div class="cmp3-modal__body">
        <div class="pwrf-filter-wrapper"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target.dataset.close === '1') modal.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('open'); });
}

// ——————————————
// 1) Build the Section K madlib string
function buildSectionKMadlib(mainRow, sdfRows) {
  const mainBrand = mainRow["data-brand"] || "Brand";
  const mainName  = mainRow["data-one"]   || "Product";
  const mainKcal  = parseInt(mainRow["ga_kcals_per_cup"], 10) || "?";

  const sdfKcals = sdfRows
    .map(r => parseInt(r["ga_kcals_per_cup"], 10))
    .filter(n => !isNaN(n));
  const minKcal = sdfKcals.length ? Math.min(...sdfKcals) : "?";
  const maxKcal = sdfKcals.length ? Math.max(...sdfKcals) : "?";

  let kcalLine = `${mainBrand} ${mainName} contains ${mainKcal} kcals/cup.`;
  if (mainKcal !== "?" && mainKcal < 410) {
    kcalLine += " This is not particularly high if you are feeding a highly active dog.";
  } else if (mainKcal !== "?" && mainKcal > 500) {
    kcalLine += " This is suitable for high-performance dogs.";
  }

  // NEW, flatter phrasing:
  const sdfLine = 
    `Sport formulas range from <span class="highlight">${minKcal}–${maxKcal}</span> kcals per cup for comparison.`;

  return `${kcalLine} ${sdfLine}`;
}

// ——————————————
// 2) Paint Section K and immediately fire Typed.js
function paintSectionK(mainRow, sdfRows) {
  // Optional: set a header
  const headerEl = document.querySelector('[data-var="sectionk-header"]');
  if (headerEl) headerEl.textContent = "Overall Formula Comparison";

  // Build and inject the text
  const text = buildSectionKMadlib(mainRow, sdfRows);
  const madlibEl = document.querySelector('[data-var="sectionk-madlib"]');
  if (!madlibEl) return;

madlibEl.setAttribute('data-text', text);
  madlibEl.textContent = text;
  madlibEl.removeAttribute('data-typed');
  // new Typed(madlibEl, { strings: [text], typeSpeed: 26, showCursor: false });

  // Kick off Typed.js
  // new Typed(madlibEl, {
  //   strings: [text],
  //   typeSpeed: 26,
  //   showCursor: false
  // });
}

function getConsumerTypeTag(type) {
  if (!type) return "";
  const t = type.toLowerCase();
  if (["fish", "meat", "poultry"].includes(t)) return "Protein";
  if (["legumes", "botanical", "fruit", "grain", "roots", "seed oil", "vegetable", "fiber", "seeds", "herb", "fish oil"].includes(t)) return "Plants";
  if (["digestive enzyme", "vitamins", "probiotics", "yeast", "minerals", "preservative", "colorant", "joint support", "prebiotic", "amino acid", "flavor enhancer"].includes(t)) return "Supplemental";
  return "Other";
}

function getIngredientCategoryCounts(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);
  const counts = { Protein: 0, Plants: 0, Supplemental: 0, Other: 0, total: ings.length };
  ings.forEach(ing => {
    const group = getConsumerTypeTag(ing["data-type"]);
    if (counts[group] !== undefined) counts[group]++;
    else counts.Other++;
  });
  return counts;
}

function buildCountsTable(row, label) {
  const counts = getIngredientCategoryCounts(row);
  return `
    <div class="ci-ing-table-cont">
      <div class="ci-ing-table-head">
        <div class="ci-ing-table-row">
          <div class="ci-ing-table-col" style="font-weight:bold;" colspan="2">${label}</div>
        </div>
      </div>
      <div class="ci-ing-table-body">
        <div class="ci-ing-table-row">
 <div class="ci-ing-table-col-val">${counts.total}</div>
          <div class="ci-ing-table-col">Total</div>
         
        </div>
        <div class="ci-ing-table-row">
        <div class="ci-ing-table-col-val">${counts.Protein}</div>
          <div class="ci-ing-table-col">Protein</div>
  
        </div>
        <div class="ci-ing-table-row">
    <div class="ci-ing-table-col-val">${counts.Plants}</div>
          <div class="ci-ing-table-col">Plants</div>
      
        </div>
        <div class="ci-ing-table-row">
        <div class="ci-ing-table-col-val">${counts.Supplemental}</div>
          <div class="ci-ing-table-col">Supplemental</div>
  
        </div>
        ${
          counts.Other
            ? `<div class="ci-ing-table-row">
   <div class="ci-ing-table-col-val">${counts.Other}</div>
                <div class="ci-ing-table-col">Other</div>
             
               </div>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildIngredientMadlib(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  const totalCount    = ings.length;
  const firstIng      = ings[0]?.displayAs || ings[0]?.Name || "";
  const secondIng     = ings[1]?.displayAs || ings[1]?.Name || "";

  const allergyCount  = ings.filter(ing => ing.tagAllergy).length;
  const poultryCount  = ings.filter(ing => ing.tagPoultry).length;
  const legumeCount   = ings.filter(ing => {
    const dt = (ing["data-type"] || "").toLowerCase();
    return dt.includes("legume");
  }).length;
  const upgradedCount = ings.filter(ing =>
    (ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
    (ing.supplementalAssist || "").toLowerCase().includes("complex")
  ).length;

  // helper to pick singular vs plural
  const pluralize = (count, singular, plural) => count === 1 ? singular : plural;

  const allergyPhrase = `(${allergyCount}) ${pluralize(allergyCount, "may trigger an allergy", "may trigger allergies")}`;
  const poultryPhrase = `(${poultryCount}) ${pluralize(poultryCount, "is poultry", "are poultry")}`;
  const legumePhrase  = `(${legumeCount}) ${pluralize(legumeCount, "is a legume", "are legumes")}`;

  // build the two sentences
  const infoSentence  = `(${totalCount}) ingredients evaluated. ` +
                        `${firstIng} is first, ${secondIng} is second. ` +
                        `${allergyPhrase}, ${poultryPhrase}, ${legumePhrase}.`;

  const mineralSentence = upgradedCount > 0
    ? `(${upgradedCount}) ${pluralize(upgradedCount, "upgraded mineral detected", "upgraded minerals detected")}.`
    : `No upgraded minerals were detected.`;

  return `${infoSentence} ${mineralSentence}`;
}




function renderIngListDivs(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  return `
    <div class="ci-ings-list">
      ${ings.map(ing => {
        let tagDivs = [];
        if (ing["data-type"]) {
          tagDivs.push(
            `<div class="ci-ing-tag ci-tag-default ci-tag-${getConsumerTypeTag(ing["data-type"]).toLowerCase()}">${getConsumerTypeTag(ing["data-type"])}</div>`
          );
        }
        if (ing.tagPoultry)     tagDivs.push(`<div class="ci-ing-tag ci-tag-poultry"><i class="fa-sharp-duotone fa-thin fa-drumstick"></i></div>`);
        if (ing.tagAllergy)     tagDivs.push(`<div class="ci-ing-tag ci-tag-allergy"><i class="fa-regular fa-wind-warning"></i></div>`);
        if (ing.tagContentious) tagDivs.push(`<div class="ci-ing-tag ci-tag-contentious"><i class="fa-solid fa-circle-exclamation"></i></div>`);
        if (ing.supplementalType === "Minerals")   tagDivs.push(`<div class="ci-ing-tag ci-tag-mineral">mineral</div>`);
        if (ing.supplementalType === "Vitamins")   tagDivs.push(`<div class="ci-ing-tag ci-tag-vitamin">vitamin</div>`);
        if (ing.supplementalType === "Probiotics") tagDivs.push(`<div class="ci-ing-tag ci-tag-probiotic">probiotic</div>`);
        if ((ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
            (ing.supplementalAssist || "").toLowerCase().includes("complex")) {
          tagDivs.push(`<div class="ci-ing-tag ci-tag-upgraded">upgraded mineral</div>`);
        }
        return `
          <div class="ci-ing-wrapper">
            <div class="ci-ing-displayas">${ing.displayAs || ing.Name}</div>
            <div class="ci-ing-tag-wrapper hide-scrollbar">${tagDivs.join("")}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function paintDualIngredientLists(mainRow, sdfRow) {
  // 1) Helpers to get ingredient arrays
  function getIngredients(row) {
    const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
    return ids.map(id => ING_MAP[id]).filter(Boolean);
  }

function renderList(ings, title, groupId) {
  return `
    <div class="pwrf-list-group" data-list="${groupId}">
      <div class="pwrf_list-title">${title}</div>
      ${ings.map(ing => {
        const searchVal = [
          ing.Name,
          ing.displayAs,
          ing.groupWith,
          ing["data-type"]      || "",
          ing.recordType        || "",
          ing.animalType        || "",
          ing.animalAssist      || "",
          ing.plantType         || "",
          ing.plantAssist       || "",
          ing.supplementalType  || "",
          ing.supplementalAssist|| "",
          ...(ing.tags || [])
        ]
        .join(" ")
        .toLowerCase();

        return `
          <div class="pwrf_dropdown-item"
               data-search="${searchVal}">
            <span class="pwrf_item-name">
              ${ing.displayAs || ing.Name}
            </span>
          </div>
        `;
      }).join("")}
      <div class="pwrf_no-results" style="display:none;">
        No ${title.toLowerCase()} found.
      </div>
    </div>
  `;
}


  // 3) Ensure wrapper
  let wrapper = document.querySelector(".pwrf-filter-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "pwrf-filter-wrapper";
    document.querySelector("#section-3")?.appendChild(wrapper);
  }

  // 4) Inject search UI + both lists
  wrapper.innerHTML = `
    <input type="text" class="pwrf_search-input" placeholder="Search ingredients…" />
    <button class="pwrf_clear-btn" style="display:none">Clear</button>
    ${renderList(getIngredients(mainRow), mainRow["data-brand"] || "Competitor", 1)}
    ${renderList(getIngredients(sdfRow), "Sport Dog Food", 2)}
  `;

  // 5) Wire it up
  const input    = wrapper.querySelector(".pwrf_search-input");
  const clearBtn = wrapper.querySelector(".pwrf_clear-btn");
  const groups   = Array.from(wrapper.querySelectorAll(".pwrf-list-group")).map(el => ({
    container: el,
    items: Array.from(el.querySelectorAll(".pwrf_dropdown-item")),
    noResults: el.querySelector(".pwrf_no-results")
  }));

  function doFilter() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      // hide everything
      clearBtn.style.display = "none";
      groups.forEach(g => {
        g.container.style.display = "none";
        g.noResults.style.display = "none";
        g.items.forEach(it => it.style.display = "none");
      });
    } else {
      clearBtn.style.display = "";
      groups.forEach(g => {
        g.container.style.display = "";
        let any = false;
        g.items.forEach(it => {
          const ok = it.dataset.search.includes(q);
          it.style.display = ok ? "" : "none";
          any = any || ok;
        });
        g.noResults.style.display = any ? "none" : "";
      });
    }
  }

  input.addEventListener("input",  doFilter);
  clearBtn.addEventListener("click", e => {
    e.preventDefault();
    input.value = "";
    doFilter();
  });

  // initialize (hide)
  doFilter();
}


function getContentiousIngredients(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);
  return ings.filter(ing => ing.tagContentious).map(ing => ing.displayAs).filter(Boolean);
}

function buildSection4Madlib(mainRow) {
  const brand   = mainRow["data-brand"];
  const product = mainRow["data-one"];
  const compIds = Array.isArray(mainRow["ing-data-fives"]) ? mainRow["ing-data-fives"] : [];

  // gather all SDF ingredient IDs
  const sdfRows  = [
    getCiRow(SDF_FORMULAS.cub),
    getCiRow(SDF_FORMULAS.dock),
    getCiRow(SDF_FORMULAS.herding)
  ].filter(Boolean);
  const sdfIdSet = new Set(
    sdfRows.flatMap(r => Array.isArray(r["ing-data-fives"]) ? r["ing-data-fives"] : [])
  );

  // find competitor-only, contentious ingredients
  const excludedNames = [...new Set(
    compIds
      .filter(id => !sdfIdSet.has(id))
      .filter(id => ING_MAP[id]?.tagContentious)
  )]
  .map(id => ING_MAP[id].displayAs || ING_MAP[id].Name)
  .filter(Boolean);

  if (excludedNames.length === 0) {
    return `There are no unique contentious ingredients in ${brand} ${product}.`;
  }

  // wrap each in a span
  const spanItems = excludedNames.map(name =>
    `<span class="cont-ingredient">${name}</span>`
  );

  // join with commas and "and"
  const joined =
    spanItems.length === 1
      ? spanItems[0]
      : spanItems.slice(0, -1).join(', ') + ' and ' + spanItems.slice(-1);

  return (
    `${brand} ${product} includes ${joined} — <span class="highlight">ingredients you won’t find in any Sport Dog Food formula</span>.`
  );
}



function runTypedForMadlib(dataVar) {
  const el = document.querySelector(`[data-var="${dataVar}"]`);
  if (!el /*|| el.getAttribute("data-typed") === "true"*/) return;
  const str = el.getAttribute("data-text");
  if (!str) return;

  el.textContent = str;
  el.setAttribute("data-typed", "true");
  // new Typed(el, { strings: [str], typeSpeed: 24, showCursor: false });
}


function lazyLoadCompareSections(mainRow, sdfRow) {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -30% 0px',
    threshold: 0.1
  };

  const sectionMap = [
    {
      id: '#section-1',
      fn: () => {
        paintSection1(mainRow, sdfRow);
        runTypedForMadlib('section1-madlib');
      }
    },
    {
      id: '#section-2',
      fn: () => {
        paintSection2(mainRow, sdfRow);
        runTypedForMadlib('section2-madlib');
        // now correctly pass sdfRow, not newRow
        renderNutrientBars(mainRow, sdfRow);
      }
    },
    {
      id: '#section-3',
      fn: () => {
        paintSection3(mainRow, sdfRow);
        // Animate each madlib slot
        [
          'section3-madlib',
          'section3-sport-madlib',
          'section3-contentious-madlib',
          'section3-sport-contentious-madlib'
        ].forEach(runTypedForMadlib);

        // Paint any dual‐ingredient lists you need
        paintDualIngredientLists(mainRow, sdfRow);
      }
    },
    {
      id: '#section-k',
      fn: () => {
        if (typeof paintSectionK === 'function') {
          paintSectionK(mainRow, [
            getCiRow(SDF_FORMULAS.cub),
            getCiRow(SDF_FORMULAS.dock),
            getCiRow(SDF_FORMULAS.herding)
          ]);
        } else {
          console.warn('[CCI] paintSectionK not defined—skipping Section K');
        }
      }
    }
  ];

  sectionMap.forEach(({ id, fn }) => {
    const target = document.querySelector(id);
    if (!target) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fn();
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);
    observer.observe(target);
  });
}


export function renderComparePage() {
  const mainFive = document.getElementById('item-faq-five')?.value?.trim();
  // FIX: compare as strings to avoid type mismatches
  const mainRow  = CI_DATA.find(r => String(r['data-five']) === String(mainFive));

  if (!mainRow) {
    console.error('[CCI] No mainRow for', mainFive);
    return;
  }

  const params    = new URLSearchParams(window.location.search);
  const paramId   = params.get('sdf');
  const defaultId = getSdfFormula(mainRow);
  const initialId = Object.values(SDF_FORMULAS).includes(paramId) ? paramId : defaultId;

  const initialRow = getCiRow(initialId);
  if (!initialRow) {
    console.error('[CCI] No SDF row for', initialId);
    return;
  }

  window.CCI = {
    mainRow,
    sdfRow: initialRow,
    ING_ANIM,
    ING_PLANT,
    ING_SUPP
  };

  // NEW: paint sticky header immediately
  if (typeof renderStickyCompareHeader === 'function') {
    renderStickyCompareHeader(mainRow, initialRow);
  }

  // 4) Lazy-load the main sections on scroll
  lazyLoadCompareSections(mainRow, initialRow);

  // 5) Wire up the buttons
  function setupSdfSwitcher(activeId) {
    const controls = Array.from(
      document.querySelectorAll('.pwr-ci-button-row [data-var]')
    ).filter(el =>
      Object.values(SDF_FORMULAS).includes(el.getAttribute('data-var'))
    );

    // Initialize: mark & hide the active one
    controls.forEach(el => {
      const id = el.getAttribute('data-var');
      el.classList.toggle('active', id === activeId);
      el.style.display = id === activeId ? 'none' : '';
    });

    // Handle clicks
    controls.forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const newId = el.getAttribute('data-var');
        if (!Object.values(SDF_FORMULAS).includes(newId)) return;

        // 1) Update URL
        params.set('sdf', newId);
        window.history.replaceState({}, '', `${location.pathname}?${params}`);

        // 2) Lookup & paint
        const newRow = getCiRow(newId);
        window.CCI.sdfRow = newRow;

        // NEW: update sticky header on switch
        if (typeof renderStickyCompareHeader === 'function') {
          renderStickyCompareHeader(mainRow, newRow);
        }

        // Repaint sections with new SDF selection
        paintSection1(mainRow, newRow);
        paintSection2(mainRow, newRow);
        paintSection3(mainRow, newRow);

        // Dual ingredient filter must re-paint on switch:
        paintDualIngredientLists(mainRow, newRow);

        if (typeof paintSectionK === 'function') {
          paintSectionK(mainRow, [
            getCiRow(SDF_FORMULAS.cub),
            getCiRow(SDF_FORMULAS.dock),
            getCiRow(SDF_FORMULAS.herding)
          ]);
        }

        // 3) Re-run Typed.js animations
        [
          'section1-madlib','section2-madlib',
          'section3-madlib','section3-sport-madlib',
          'section3-contentious-madlib','section3-sport-contentious-madlib',
          'sectionk-madlib'
        ].forEach(runTypedForMadlib);

        // 4) Update button states
        controls.forEach(b => {
          const bid = b.getAttribute('data-var');
          b.classList.toggle('active', bid === newId);
          b.style.display = bid === newId ? 'none' : '';
        });
      });
    });
  }

  // 6) Finally, kick off the switcher
  setupSdfSwitcher(initialId);
}
