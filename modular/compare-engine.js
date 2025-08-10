// compare-engine.js
/* eslint-disable no-console */
import { CI_DATA }   from './ci.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';
// Typed.js is loaded via your page’s <script> include if you re-enable it

// ===========================
// Config / utils
// ===========================
const DEBUG = false;
const log = (...a) => { if (DEBUG) console.log('[compare]', ...a); };

const CDN = "https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41";

// Escape any text that goes into innerHTML
const esc = (s) => String(s ?? '')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&#39;');

// ===========================
// Lazy background helper
// ===========================
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

function setLazyBackground(el, url) {
  if (!el || !url) return;
  if (DEBUG) console.log('[lazy] set bg', el, url);
  el.dataset.bg = url;
  if (bgObserver) {
    bgObserver.observe(el);
  } else {
    el.style.backgroundImage    = `url("${url}")`;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
    el.classList.remove('lazy-bg');
  }
}

// ===========================
// Shell paint
// ===========================
export function paintCompareShell({
  containerSelector = '.pwr-section-container',
  brand = 'the competition',
  inputPresets = ["Type: Purina Pro Plan", "Try: Grain Free"]
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
          See how our diets outwork <span class="brand-highlight">${esc(brand)}</span>
        </div>
        <div id="pwr-search-subtitle" class="pwr-search-subtitle">
          <div>Pick a brand to compare against Sport Dog Food.</div>
        </div>
      </div>
      <div class="pwr-chat-markup-wrapper">
        <div class="chat-markup w-embed">
          <div class="pwr-chat-content">
            <div class="pwr-search-input-bar">
              <input id="pwr-prompt-input" class="pwr-search-input" type="text" placeholder="${esc(inputPresets[0])}" autocomplete="off" aria-label="Search compare items">
              <button id="pwr-clear-button" class="pwr-clear-button" aria-label="Clear input" type="button" style="display:none">×</button>
            </div>
            <div class="pwr-pills-row" style="display:flex">
              <button class="pwr-arrow pwr-arrow-prev" aria-label="Scroll left" tabindex="0" type="button">&lt;</button>
              <div id="pwr-initial-suggestions" class="pwr-starter-menu" style="display:flex"></div>
              <button class="pwr-arrow pwr-arrow-next" aria-label="Scroll right" tabindex="0" type="button">&gt;</button>
            </div>
            <ul id="pwr-suggestion-list" class="pwr-suggestion-list" style="display:none"></ul>
            <div id="pwr-answer-output" class="pwr-answer-output" style="display:none">
              <button class="pwr-answer-close" aria-label="Close answer" type="button">×</button>
              <div class="pwr-answer-output-flex">
                <span id="pwr-answer-text" class="pwr-answer-text" aria-live="polite"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const heroPresets = [
    `See how our diets outwork <span class='brand-highlight'>${esc(brand)}</span>`,
    `Discover what sets us apart from <span class='brand-highlight'>${esc(brand)}</span>`
  ];
  const label = container.querySelector('#pwr-fake-label');
  if (label) label.innerHTML = heroPresets[Math.floor(Math.random() * heroPresets.length)];

  const input = container.querySelector('#pwr-prompt-input');
  let i = 0;
  if (input && inputPresets.length > 1) {
    setInterval(() => {
      i = (i + 1) % inputPresets.length;
      input.placeholder = inputPresets[i];
    }, 4000);
  }
}

// ===========================
// Data helpers
// ===========================
const SDF_FORMULAS = { cub: "29280", dock: "29099", herding: "28979" };
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

function buildLegumePoultryPhrase(row) {
  const vL = (row["data-legumes"] || "").toLowerCase();
  const vP = (row["data-poultry"] || "").toLowerCase();
  const freeL = vL.includes("free") || vL.includes("no");
  const freeP = vP.includes("free") || vP.includes("no");
  const legumePhrase  = freeL ? "legume-free"  : "contains legumes";
  const poultryPhrase = freeP ? "poultry-free" : "contains poultry";
  if (freeL && freeP)   return `${legumePhrase} and ${poultryPhrase}`;
  if (!freeL && !freeP) return `${legumePhrase} and ${poultryPhrase}`;
  if (freeL && !freeP)  return `${legumePhrase} but ${poultryPhrase}`;
  return `${poultryPhrase} but ${legumePhrase}`;
}

function getConsumerTypeTag(type) {
  if (!type) return "Other";
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
  for (const ing of ings) {
    const g = getConsumerTypeTag(ing["data-type"]);
    if (counts[g] !== undefined) counts[g]++; else counts.Other++;
  }
  return counts;
}

// (kept, hyphen-safe class setter; not strictly required elsewhere)
function setDataClass(el, base, key, value, map) {
  if (!el) return;
  const prefix = `${base}-${key}-`;
  [...el.classList].forEach(cls => { if (cls.startsWith(prefix)) el.classList.remove(cls); });
  let segmentKey = Object.keys(map || {}).find(k => k.toLowerCase() === (value || '').toLowerCase());
  let segment = segmentKey ? map[segmentKey] : (value || '').toLowerCase().replace(/\s+/g, '-');
  if (segment) el.classList.add(`${prefix}${segment}`);
}

// ===========================
// Sticky header (exact markup)
// ===========================
export function renderStickyCompareHeader(mainRow, sdfRow, containerSelector = '#compare-sticky') {
  const root = document.querySelector(containerSelector);
  if (!root) return;

  const brandName = (mainRow['data-brand'] || '').trim() || 'Competitor';
  const brandProd = (mainRow['data-one']   || '').trim();
  const sportBrand = 'SPORT DOG FOOD';
  const sportProd  = (sdfRow['data-one'] || '').trim();

  root.innerHTML = `
    <header class="cmp-head" aria-label="Compare header">
      <div class="label-spacer" aria-hidden="true"></div>

      <div class="cmp-head-col" role="group" aria-label="Competitor">
        <div class="cmp-head-img lazy-bg" aria-hidden="true"></div>
        <div>
          <div class="cmp-head-brand">${esc(brandName).toUpperCase()}</div>
          <div class="cmp-head-name">${esc(brandProd)}</div>
        </div>
      </div>

      <div class="cmp-head-col" role="group" aria-label="Sport Dog Food">
        <div class="cmp-head-img lazy-bg" aria-hidden="true"></div>
        <div>
          <div class="cmp-head-brand">${esc(sportBrand)}</div>
          <div class="cmp-head-name">${esc(sportProd)}</div>
        </div>
      </div>
    </header>
  `;

  // lazy bg images (keep your existing helper)
  const [cmpImg, sdfImg] = root.querySelectorAll('.cmp-head-img');
  if (cmpImg && mainRow.previewengine) setLazyBackground(cmpImg, mainRow.previewengine);
  if (sdfImg && sdfRow.previewengine)  setLazyBackground(sdfImg,  sdfRow.previewengine);
}


// ===========================
// Section 1 (exact row markup)
// ===========================
export function paintSection1(mainRow, sdfRow, sectionSelector = '#section-1') {
  const mount = document.querySelector(sectionSelector);
  if (!mount) return;

  // ensure <section class="rows"> exists inside #section-1
  let rowsSec = mount.querySelector(':scope > section.rows');
  if (!rowsSec) {
    rowsSec = document.createElement('section');
    rowsSec.className = 'rows';
    rowsSec.setAttribute('aria-label', 'Attribute comparison');
    mount.appendChild(rowsSec);
  }

  const compFull  = `${(mainRow['data-brand'] || 'Competitor')} — ${(mainRow['data-one'] || '').trim()}`.trim();
  const sportFull = `Sport Dog Food — ${(sdfRow['data-one'] || '').trim()}`.trim();

  const dietText = v =>
    /free/i.test(v) ? 'Grain Free' :
    /grain/i.test(v) ? 'Grain Inclusive' : '—';
  const legumesText = v =>
    /(free|no)/i.test(v) ? 'Legume-Free' :
    /legume|pea/i.test(v) ? 'Contains Legumes' : '—';
  const poultryText = v =>
    /(free|no)/i.test(v) ? 'Poultry-Free' :
    /poultry|chicken/i.test(v) ? 'Contains Poultry' : '—';
  const flavorText = v =>
    /\b(chicken|poultry)\b/i.test(v) ? 'Poultry' :
    /\bbeef\b/i.test(v) ? 'Beef' :
    /\bfish|salmon\b/i.test(v) ? 'Fish' :
    /\bbison|buffalo\b/i.test(v) ? 'Buffalo' :
    /\bmeat\b/i.test(v) ? 'Meat' : '—';

  // tiny icon set to mirror your sample
  const icons = {
    diet:    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2b384e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M7 8c2 0 3-2 3-4M7 14c2 0 3-2 3-4M17 8c-2 0-3-2-3-4M17 14c-2 0-3-2-3-4"/></svg>`,
    dietB:   `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2b384e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M8.5 8c1.5 0 2.5-2 2.5-4M8.5 14c1.5 0 2.5-2 2.5-4M15.5 8C14 8 13 6 13 4M15.5 14C14 14 13 12 13 10"/></svg>`,
    circle:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2b384e" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>`,
    bars:    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2b384e" stroke-width="1.8" aria-hidden="true"><path d="M4 18h16M8 6h8M6 12h12"/></svg>`,
    tri:     `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2b384e" stroke-width="1.8" aria-hidden="true"><path d="M5 19l7-14 7 14z"/></svg>`,
    check:   `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>`
  };

  // if you have real scoring, plug it in here
  const deltaFor = (_key, _a, _b, which) => {
    // return { txt: '+7', cls: 'pos' } etc.  Default to zero to match sample shape.
    return { txt: '±0', cls: 'zero' };
  };

  const rows = [
    {
      label: 'Diet',
      aTxt: dietText(mainRow['data-diet'] || mainRow['data-grain'] || ''),
      bTxt: dietText(sdfRow['data-diet']  || sdfRow['data-grain']  || ''),
      aIcon: icons.diet, bIcon: icons.dietB
    },
    {
      label: 'Legumes',
      aTxt: legumesText(mainRow['data-legumes'] || ''),
      bTxt: legumesText(sdfRow['data-legumes']  || ''),
      aIcon: icons.circle, bIcon: icons.circle
    },
    {
      label: 'Poultry',
      aTxt: poultryText(mainRow['data-poultry'] || ''),
      bTxt: poultryText(sdfRow['data-poultry']  || ''),
      aIcon: icons.bars, bIcon: icons.bars
    },
    {
      label: 'Primary Protein',
      aTxt: flavorText(mainRow['specs_primary_flavor'] || ''),
      bTxt: flavorText(sdfRow['specs_primary_flavor']  || ''),
      aIcon: icons.tri, bIcon: icons.tri
    }
  ];

  rowsSec.innerHTML = rows.map((r, i) => {
    const dA = deltaFor(r.label, r.aTxt, r.bTxt, 'A');
    const dB = deltaFor(r.label, r.aTxt, r.bTxt, 'B');
    return `
      <div class="row">
        <div class="label">${esc(r.label)}</div>

        <div class="value valueA" data-col="${esc(compFull)}">
          ${r.aIcon}
          <span class="txt">${esc(r.aTxt)}</span>
          <span class="status">
            <span class="check">${icons.check}</span>
            <span class="delta ${esc(dA.cls)}">${esc(dA.txt)}</span>
          </span>
        </div>

        <div class="value valueB" data-col="${esc(sportFull)}">
          ${r.bIcon}
          <span class="txt">${esc(r.bTxt)}</span>
          <span class="status">
            <span class="check">${icons.check}</span>
            <span class="delta ${esc(dB.cls)}">${esc(dB.txt)}</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}
// ===========================
// Section 2 (Group 2 + two distinct bars per row, below each row)
// ===========================
export function paintSection2(mainRow, sdfRow) {
  const headerEl = document.querySelector('[data-var="section2-header"]');
  if (headerEl) headerEl.textContent = "Performance Essentials";
  const subtitleEl = document.querySelector('[data-var="section2-subtitle"]');
  if (subtitleEl) {
    subtitleEl.textContent = `Protein, fat, and calories for ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;
  }

  const root = document.querySelector('#section-2 .cmp2-rows');
  if (!root) return;

  const vals = (row) => ({
    protein: Number(row["ga_crude_protein_%"]) || 0,
    fat:     Number(row["ga_crude_fat_%"])     || 0,
    kcals_c: Number(row["ga_kcals_per_cup"])   || 0,
    kcals_k: Number(row["ga_kcals_per_kg"])    || 0
  });

  const b = vals(mainRow);
  const s = vals(sdfRow);

  // visual maxes for bar widths
  const MAX = { protein: 40, fat: 30, kcals_c: 600, kcals_k: 5500 };
  const pct = (val, max) => Math.max(2, Math.round((val / max) * 100));

  const row = (key, label, unit = '') => {
    const bv = b[key], sv = s[key];
    const diff = sv - bv;
    const diffTxt  = isNaN(diff) ? '—' : (diff === 0 ? '±0' : (diff > 0 ? `+${diff}` : `${diff}`));
    const badge    = (diff === 0) ? 'Match' : 'Different';
    const badgeCls = (diff === 0) ? 'match' : 'diff';
    const maxKey   = key in MAX ? MAX[key] : Math.max(bv, sv) || 1;

    const fmt = (v) => unit ? `${v}${unit}` : String(v);

    return `
      <div class="cmp2-row" data-key="${esc(key)}">
        <div class="cmp2-label">${esc(label)}</div>
        <div class="cmp2-diff">${esc(diffTxt)}</div>
        <div class="cmp2-delta ${badgeCls}">${badge}</div>
      </div>

      <div class="cmp2-bars">
        <div class="cmp2-bar brand" aria-label="Competitor ${esc(label)}">
          <div class="cmp2-track"><div class="cmp2-fill brand" style="width:${pct(bv, maxKey)}%"></div></div>
          <div class="cmp2-values">
            <span class="cmp2-badge brand">${esc(fmt(bv))}</span>
          </div>
        </div>

        <div class="cmp2-bar sport" aria-label="Sport Dog Food ${esc(label)}">
          <div class="cmp2-track"><div class="cmp2-fill sport" style="width:${pct(sv, maxKey)}%"></div></div>
          <div class="cmp2-values">
            <span class="cmp2-badge sport">${esc(fmt(sv))}</span>
          </div>
        </div>
      </div>
    `;
  };

  root.innerHTML = [
    row('protein', 'Crude Protein', '%'),
    row('fat',     'Crude Fat',     '%'),
    row('kcals_c', 'Kcals / Cup',   ''),
    row('kcals_k', 'Kcals / Kg',    '')
  ].join('');

  // Optional summary
  const madlibEl = document.querySelector('[data-var="section2-madlib"]');
  if (madlibEl) {
    madlibEl.textContent =
      `${mainRow["data-brand"]} ${mainRow["data-one"]}: ${b.protein}% protein, ${b.fat}% fat, ${b.kcals_c} kcals/cup. ` +
      `Sport Dog Food ${sdfRow["data-one"]}: ${s.protein}% protein, ${s.fat}% fat, ${s.kcals_c} kcals/cup.`;
  }
}

// ===========================
// Section 3 (ingredients overlay + modal search + swap)
// ===========================
export function paintSection3(mainRow, sdfRow) {
  // headers
  const h = document.querySelector('[data-var="section3-header"]');
  if (h) h.textContent = 'Under the Hood';
  const p = document.querySelector('[data-var="section3-subtitle"]');
  if (p) p.textContent = "Let's dig in and see how each ingredient stacks up.";

  const sec3 = document.querySelector('#section-3');
  if (!sec3) return;

  // Ensure DOM scaffold exists
  ensureSection3Dom(sec3);

  // Targets
  const rowsRoot    = sec3.querySelector('#cmp3-rows');
  const brandNameEl = sec3.querySelector('[data-var="brand-1-sec3-name"]');
  const sportNameEl = sec3.querySelector('[data-var="sport-1-sec3-name"]');
  const brandListEl = sec3.querySelector('[data-var="brand-1-sec3-inglist"]');
  const sportListEl = sec3.querySelector('[data-var="sport-1-sec3-inglist"]');
  if (!rowsRoot || !brandNameEl || !sportNameEl || !brandListEl || !sportListEl) return;

  // Totals overlay
  const countsB = getIngredientCategoryCounts(mainRow);
  const countsS = getIngredientCategoryCounts(sdfRow);
  const overlayRow = (key, label) => {
    const b = countsB[key] ?? 0;
    const s = countsS[key] ?? 0;
    const diff = s - b;
    const diffTxt  = diff === 0 ? '±0' : (diff > 0 ? `+${diff}` : `${diff}`);
    const badge    = diff === 0 ? 'Match' : 'Different';
    const badgeCls = diff === 0 ? 'match' : 'diff';
    return `
      <div class="cmp3-row" data-key="${esc(key)}">
        <div class="cmp3-label">${esc(label)}</div>
        <div class="cmp3-values">
          <span class="cmp3-badge brand">${b}</span>
          <span class="cmp3-badge sport">${s}</span>
        </div>
        <div class="cmp3-diff">${esc(diffTxt)}</div>
        <div class="cmp3-delta ${badgeCls}">${badge}</div>
      </div>
    `;
  };
  rowsRoot.innerHTML = [
    overlayRow('total',        'Total Ingredients'),
    overlayRow('Protein',      'Protein'),
    overlayRow('Plants',       'Plants'),
    overlayRow('Supplemental', 'Supplemental'),
    (countsB.Other || countsS.Other) ? overlayRow('Other', 'Other') : ''
  ].join('');

  // Names
  brandNameEl.textContent = mainRow['data-brand']
    ? `${mainRow['data-brand']} ${mainRow['data-one'] || ''}`.trim()
    : (mainRow['data-one'] || '');
  sportNameEl.textContent = `Sport Dog Food ${sdfRow['data-one'] || ''}`.trim();

  // Lists
  brandListEl.innerHTML = renderIngListDivs(mainRow);
  sportListEl.innerHTML = renderIngListDivs(sdfRow);

  // Modal: wire button to open canonical modal
  ensureIngSearchModal(); // ensure it exists once (or adapt to existing)
  const openBtn = sec3.querySelector('#open-ing-search');
  if (openBtn && !openBtn._wired) {
    openBtn._wired = true;
    openBtn.addEventListener('click', () => openIngredientModal(mainRow, sdfRow));
  }

  // Swap order
  const swapBtn    = sec3.querySelector('#swap-ing-order');
  const listsWrap  = sec3.querySelector('#cmp3-lists');
  const brandBlock = sec3.querySelector('#cmp3-brand-list');
  const sportBlock = sec3.querySelector('#cmp3-sport-list');
  if (swapBtn && !swapBtn._wired) {
    swapBtn._wired = true;
    swapBtn.addEventListener('click', () => {
      const swapped = swapBtn.getAttribute('aria-pressed') === 'true';
      swapBtn.setAttribute('aria-pressed', String(!swapped));
      if (!swapped) {
        if (sportBlock && listsWrap) listsWrap.insertBefore(sportBlock, brandBlock);
      } else {
        if (brandBlock && listsWrap) listsWrap.insertBefore(brandBlock, sportBlock);
      }
    });
  }
}

// Build/repair the Section 3 DOM scaffold if missing pieces
function ensureSection3Dom(sec3) {
  const ok =
    sec3.querySelector('.cmp3') &&
    sec3.querySelector('#cmp3-rows') &&
    sec3.querySelector('#cmp3-lists') &&
    sec3.querySelector('#cmp3-brand-list') &&
    sec3.querySelector('#cmp3-sport-list') &&
    sec3.querySelector('[data-var="brand-1-sec3-inglist"]') &&
    sec3.querySelector('[data-var="sport-1-sec3-inglist"]');

  if (ok) return;

  sec3.innerHTML = `
    <div class="cmp3">
      <div class="cmp3-rows" id="cmp3-rows"></div>

      <div class="cmp3-actions">
        <button class="cmp3-btn" id="open-ing-search" type="button">Search ingredients</button>
        <button class="cmp3-btn" id="swap-ing-order" aria-pressed="false" type="button">Swap order (Sport ⇄ Compare)</button>
      </div>

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

// ===========================
// Modal (single canonical version): fixed size + body scroll lock
// ===========================
function lockBodyScroll() {
  const y = window.scrollY || 0;
  document.documentElement.classList.add('no-scroll');
  document.body.style.top = `-${y}px`;
  document.body.dataset.scrollY = String(y);
}
function unlockBodyScroll() {
  const y = parseInt(document.body.dataset.scrollY || '0', 10);
  document.documentElement.classList.remove('no-scroll');
  document.body.style.top = '';
  delete document.body.dataset.scrollY;
  window.scrollTo(0, y);
}

// Create the modal once; return it
function ensureIngSearchModal() {
  let modal = document.getElementById('ing-search-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'ing-search-modal';
  modal.className = 'cmp3-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="cmp3-modal__backdrop" data-close="1"></div>
    <div class="cmp3-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ing-search-title">
      <div class="cmp3-modal__head">
        <h3 id="ing-search-title">Search Ingredients</h3>
        <div class="pwrf_searchbar" role="search">
          <input type="text" class="pwrf_search-input" placeholder="Search ingredients…" aria-label="Search ingredients"/>
          <button class="pwrf_clear-btn" type="button" aria-label="Clear">×</button>
        </div>
        <button class="cmp3-btn cmp3-modal__close" data-close="1" aria-label="Close" type="button">×</button>
      </div>
      <div class="cmp3-modal__body">
        <div class="pwrf_results" aria-live="polite"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close on backdrop/X
  modal.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]');
    if (closer) closeIngredientModal();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeIngredientModal();
  });

  return modal;
}

function openIngredientModal(mainRow, sdfRow) {
  const modal = ensureIngSearchModal();
  if (!modal.classList.contains('open')) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
  }

  // Preferred (canonical) structure
  let resultsEl = modal.querySelector('.pwrf_results');
  let inputEl   = modal.querySelector('.pwrf_search-input');
  let clearBtn  = modal.querySelector('.pwrf_clear-btn');

  // Fallback: support legacy static modal with .pwrf-filter-wrapper (inject searchbar inside it)
  if (!resultsEl) {
    const mount = modal.querySelector('.pwrf-filter-wrapper');
    if (mount) {
      mount.innerHTML = `
        <div class="pwrf_searchbar" role="search">
          <input type="text" class="pwrf_search-input" placeholder="Search ingredients…" aria-label="Search ingredients"/>
          <button class="pwrf_clear-btn" type="button" aria-label="Clear">×</button>
        </div>
        <div class="pwrf_results" aria-live="polite"></div>
      `;
      resultsEl = mount.querySelector('.pwrf_results');
      inputEl   = mount.querySelector('.pwrf_search-input');
      clearBtn  = mount.querySelector('.pwrf_clear-btn');
    }
  }

  if (resultsEl && inputEl && clearBtn) {
    paintDualIngredientLists(mainRow, sdfRow, resultsEl, inputEl, clearBtn);
    inputEl.focus();
  }
}

function closeIngredientModal() {
  const modal = document.getElementById('ing-search-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  unlockBodyScroll();
}

// Render the two lists + live filter (results don’t resize the modal)
function paintDualIngredientLists(mainRow, sdfRow, resultsEl, inputEl, clearBtn) {
  const listHtml = (ings, title) => `
    <div class="pwrf-list-group">
      <div class="pwrf_list-title">${esc(title)}</div>
      <div class="pwrf_list-body">
        ${ings.map(ing => {
          const searchVal = [
            ing.Name, ing.displayAs, ing.groupWith,
            ing['data-type']||'', ing.recordType||'',
            ing.animalType||'', ing.animalAssist||'',
            ing.plantType||'',  ing.plantAssist||'',
            ing.supplementalType||'', ing.supplementalAssist||'',
            ...(ing.tags||[])
          ].join(' ').toLowerCase();
          return `
            <div class="pwrf_item" data-search="${esc(searchVal)}">
              <div class="pwrf_item-name">${esc(ing.displayAs || ing.Name || '')}</div>
            </div>`;
        }).join('')}
      </div>
      <div class="pwrf_no-results" hidden>No ${esc(title.toLowerCase())} found.</div>
    </div>
  `;

  const getIngs = (row) => {
    const ids = Array.isArray(row['ing-data-fives']) ? row['ing-data-fives'] : [];
    return ids.map(id => ING_MAP[id]).filter(Boolean);
  };

  resultsEl.innerHTML = `
    ${listHtml(getIngs(mainRow), mainRow['data-brand'] || 'Competitor')}
    ${listHtml(getIngs(sdfRow),  'Sport Dog Food')}
  `;

  const groups = Array.from(resultsEl.querySelectorAll('.pwrf-list-group')).map(g => ({
    container: g,
    items: Array.from(g.querySelectorAll('.pwrf_item')),
    empty: g.querySelector('.pwrf_no-results')
  }));

  function doFilter() {
    const q = inputEl.value.trim().toLowerCase();
    clearBtn.hidden = !q;
    groups.forEach(g => {
      let any = false;
      g.items.forEach(it => {
        const ok = q && it.dataset.search.includes(q);
        it.hidden = !ok;
        if (ok) any = true;
      });
      g.empty.hidden = any || !q;
    });
    if (!q) { // stable empty state
      groups.forEach(g => {
        g.items.forEach(it => it.hidden = true);
        g.empty.hidden = true;
      });
    }
  }

  let to = 0;
  const debounced = () => { clearTimeout(to); to = setTimeout(doFilter, 100); };

  inputEl.oninput = debounced; // replace any previous listeners
  clearBtn.onclick = (e) => {
    e.preventDefault();
    inputEl.value = '';
    doFilter();
    inputEl.focus();
  };

  doFilter(); // start empty
}

// Render inline ingredient list tags
function renderIngListDivs(row) {
  const ids = Array.isArray(row['ing-data-fives']) ? row['ing-data-fives'] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  return `
    <div class="ci-ings-list">
      ${ings.map(ing => {
        const display = esc(ing.displayAs || ing.Name || '');
        const tags = [];
        if (ing['data-type']) {
          const tag = getConsumerTypeTag(ing['data-type']);
          tags.push(`<div class="ci-ing-tag ci-tag-default ci-tag-${esc(tag.toLowerCase())}">${esc(tag)}</div>`);
        }
        if (ing.tagPoultry)     tags.push(`<div class="ci-ing-tag ci-tag-poultry" title="Poultry" aria-label="Poultry"></div>`);
        if (ing.tagAllergy)     tags.push(`<div class="ci-ing-tag ci-tag-allergy" title="Allergy" aria-label="Allergy"></div>`);
        if (ing.tagContentious) tags.push(`<div class="ci-ing-tag ci-tag-contentious" title="Contentious" aria-label="Contentious"></div>`);
        if (ing.supplementalType === 'Minerals')   tags.push(`<div class="ci-ing-tag ci-tag-mineral">mineral</div>`);
        if (ing.supplementalType === 'Vitamins')   tags.push(`<div class="ci-ing-tag ci-tag-vitamin">vitamin</div>`);
        if (ing.supplementalType === 'Probiotics') tags.push(`<div class="ci-ing-tag ci-tag-probiotic">probiotic</div>`);
        const assist = (ing.supplementalAssist || '').toLowerCase();
        if (assist.includes('chelate') || assist.includes('complex')) {
          tags.push(`<div class="ci-ing-tag ci-tag-upgraded">upgraded mineral</div>`);
        }
        return `
          <div class="ci-ing-wrapper">
            <div class="ci-ing-displayas">${display}</div>
            <div class="ci-ing-tag-wrapper hide-scrollbar">${tags.join('')}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ===========================
// Utility: wait for an element (and optional child)
// ===========================
function waitForEl(selector, { childSelector = null, timeout = 5000 } = {}) {
  return new Promise((resolve) => {
    const root = document.querySelector(selector);
    if (root && (!childSelector || root.querySelector(childSelector))) return resolve(root);

    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el && (!childSelector || el.querySelector(childSelector))) {
        obs.disconnect();
        resolve(el);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      resolve(document.querySelector(selector) || null);
    }, timeout);
  });
}

/**
 * Sync the hidden Webflow CMS selection UI to a given SDF id.
 * Expects:
 *   <div id="cms-select-list">
 *     <div class="collection-item">
 *       <div class="cms-selected hidden" data-key="29099"></div>
 *     </div>
 *   </div>
 */
async function syncCmsSelection(sdfId) {
  const cmsRoot = await waitForEl('#cms-select-list', { childSelector: '[data-key]' });
  if (!cmsRoot) {
    console.warn('[compare] CMS list not found');
    return;
  }

  const items = Array.from(cmsRoot.querySelectorAll('[data-key]'));
  if (!items.length) {
    console.warn('[compare] CMS list has no [data-key] items');
    return;
  }

  const key = String(sdfId);
  items.forEach((el) => {
    const isMatch = String(el.getAttribute('data-key')) === key;
    el.classList.toggle('hidden', !isMatch);
    el.setAttribute('aria-hidden', String(!isMatch));
    el.setAttribute('aria-selected', String(isMatch));
    el.classList.toggle('is-selected', isMatch);
  });
}

/** Call once on load to set the initial selection after CMS renders */
function initCmsSelection(initialId) {
  syncCmsSelection(initialId);
}

// ===========================
// Section K (optional summary)
// ===========================
function buildSectionKMadlib(mainRow, sdfRows) {
  const mainBrand = mainRow["data-brand"] || "Brand";
  const mainName  = mainRow["data-one"]   || "Product";
  const mainKcal  = parseInt(mainRow["ga_kcals_per_cup"], 10) || "?";

  const sdfKcals = sdfRows.map(r => parseInt(r["ga_kcals_per_cup"], 10)).filter(n => !isNaN(n));
  const minKcal = sdfKcals.length ? Math.min(...sdfKcals) : "?";
  const maxKcal = sdfKcals.length ? Math.max(...sdfKcals) : "?";

  let kcalLine = `${mainBrand} ${mainName} contains ${mainKcal} kcals/cup.`;
  if (mainKcal !== "?" && mainKcal < 410) kcalLine += " This is not particularly high if you are feeding a highly active dog.";
  else if (mainKcal !== "?" && mainKcal > 500) kcalLine += " This is suitable for high-performance dogs.";

  const sdfLine = `Sport formulas range from <span class="highlight">${minKcal}–${maxKcal}</span> kcals per cup for comparison.`;
  return `${kcalLine} ${sdfLine}`;
}

export function paintSectionK(mainRow, sdfRows) {
  const headerEl = document.querySelector('[data-var="sectionk-header"]');
  if (headerEl) headerEl.textContent = "Overall Formula Comparison";

  const text = buildSectionKMadlib(mainRow, sdfRows);
  const madlibEl = document.querySelector('[data-var="sectionk-madlib"]');
  if (!madlibEl) return;
  madlibEl.setAttribute('data-text', text);
  madlibEl.innerHTML = text;
}

// ===========================
// Render-all helper (no lazy IO)
// ===========================
function renderAllSections(mainRow, sdfRow) {
  paintSection1(mainRow, sdfRow);
  paintSection2(mainRow, sdfRow);
  paintSection3(mainRow, sdfRow);
  if (typeof paintSectionK === 'function') {
    paintSectionK(mainRow, [
      getCiRow(SDF_FORMULAS.cub),
      getCiRow(SDF_FORMULAS.dock),
      getCiRow(SDF_FORMULAS.herding)
    ]);
  }
}

// ===========================
// Entry
// ===========================
export function renderComparePage() {
  const mainFive = document.getElementById('item-faq-five')?.value?.trim();
  const mainRow  = CI_DATA.find(r => String(r['data-five']) === String(mainFive));
  if (!mainRow) { console.error('[CCI] No mainRow for', mainFive); return; }

  const params    = new URLSearchParams(window.location.search);
  const paramId   = params.get('sdf');
  const defaultId = getSdfFormula(mainRow);
  const initialId = Object.values(SDF_FORMULAS).includes(paramId) ? paramId : defaultId;

  const initialRow = getCiRow(initialId);
  if (!initialRow) { console.error('[CCI] No SDF row for', initialId); return; }

  window.CCI = { mainRow, sdfRow: initialRow, ING_ANIM, ING_PLANT, ING_SUPP };

  // Sticky header immediately
  if (typeof renderStickyCompareHeader === 'function') {
    renderStickyCompareHeader(mainRow, initialRow);
  }

  // Render all sections (no lazy IO)
  renderAllSections(mainRow, initialRow);

  // Init hidden CMS selection
  initCmsSelection(initialId);

  // Switcher
  function setupSdfSwitcher(activeId) {
    const controls = Array.from(
      document.querySelectorAll('.pwr-ci-button-row [data-var]')
    ).filter(el => Object.values(SDF_FORMULAS).includes(el.getAttribute('data-var')));

    controls.forEach(el => {
      const id = el.getAttribute('data-var');
      el.classList.toggle('active', id === activeId);
      el.style.display = id === activeId ? 'none' : '';
    });

    controls.forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const newId = el.getAttribute('data-var');
        if (!Object.values(SDF_FORMULAS).includes(newId)) return;

        // Update URL
        params.set('sdf', newId);
        window.history.replaceState({}, '', `${location.pathname}?${params}`);

        // Lookup & paint
        const newRow = getCiRow(newId);
        window.CCI.sdfRow = newRow;

        renderStickyCompareHeader(mainRow, newRow);
        renderAllSections(mainRow, newRow);

        // keep the hidden CMS selection in sync
        syncCmsSelection(newId);

        // Button states
        controls.forEach(b => {
          const bid = b.getAttribute('data-var');
          b.classList.toggle('active', bid === newId);
          b.style.display = bid === newId ? 'none' : '';
        });
      });
    });
  }

  setupSdfSwitcher(initialId);
}
