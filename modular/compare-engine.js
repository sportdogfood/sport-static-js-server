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
  if (!el) return;
  if (!url) return;
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
  const legumePhrase  = freeL ? "legume-free"      : "contains legumes";
  const poultryPhrase = freeP ? "poultry-free"     : "contains poultry";
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

// ===========================
// Class setter (hyphen-safe)
// ===========================
function setDataClass(el, base, key, value, map) {
  if (!el) return;
  const prefix = `${base}-${key}-`;
  // remove any existing classes with that prefix
  [...el.classList].forEach(cls => { if (cls.startsWith(prefix)) el.classList.remove(cls); });
  let segmentKey = Object.keys(map || {}).find(k => k.toLowerCase() === (value || '').toLowerCase());
  let segment = segmentKey ? map[segmentKey] : (value || '').toLowerCase().replace(/\s+/g, '-');
  if (segment) el.classList.add(`${prefix}${segment}`);
}

// ===========================
// Sticky header
// ===========================
export function renderStickyCompareHeader(mainRow, sdfRow) {
  const root = document.getElementById('compare-sticky');
  if (!root) return;

  if (!root.querySelector('.cmp-head')) {
    root.innerHTML = `
      <div class="cmp-head">
        <div class="cmp-head-col brand">
          <div class="cmp-head-img lazy-bg" data-var="compare-1-preview" aria-hidden="true"></div>
          <div class="cmp-head-meta">
            <div class="cmp-head-brand" data-var="compare-1-brand"></div>
            <div class="cmp-head-name"  data-var="compare-1-name"></div>
          </div>
        </div>
        <div class="cmp-head-col sport">
          <div class="cmp-head-img lazy-bg" data-var="sport-1-previewimg" aria-hidden="true"></div>
          <div class="cmp-head-meta">
            <div class="cmp-head-brand" data-var="sport-1-brand"></div>
            <div class="cmp-head-name"  data-var="sport-1-name"></div>
          </div>
        </div>
      </div>
    `;
  }

  const setText = (sel, v) => {
    const el = root.querySelector(`[data-var="${sel}"]`);
    if (el) el.textContent = v || '';
  };
  setText('compare-1-brand', mainRow['data-brand']);
  setText('compare-1-name',  mainRow['data-one']);
  setText('sport-1-brand',   'Sport Dog Food');
  setText('sport-1-name',    sdfRow['data-one']);

  const bImg = root.querySelector('[data-var="compare-1-preview"]');
  const sImg = root.querySelector('[data-var="sport-1-previewimg"]');
  if (bImg && mainRow.previewengine) setLazyBackground(bImg, mainRow.previewengine);
  if (sImg && sdfRow.previewengine)  setLazyBackground(sImg,  sdfRow.previewengine);
}

// ===========================
// Section 1 (Group 1 attributes)
// ===========================
export function paintSection1(mainRow, sdfRow) {
  const headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Nutrition Profile";
  const subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) {
    subtitleEl.innerHTML =
      `<span class="span-compare">Comparing</span><br>` +
      `${esc(mainRow["data-brand"])} ${esc(mainRow["data-one"])}<br>` +
      `<img src="${CDN}/688bad97d808a1d5e76a8eb2_versus.svg" alt="versus" class="vs-icon" style="vertical-align:middle;width:1.6em;height:1em;margin:0 0.3em;"><br>` +
      `Sport Dog Food ${esc(sdfRow["data-one"])}`;
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

  const setDelta = (a, b) => a === b ? 'Match' : 'Different';

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
    <div class="cmp1-row" data-key="${esc(r.key)}">
      <div class="cmp1-label">${esc(r.label)}</div>
      <div class="cmp1-values">
        <span class="cmp1-badge brand">${esc(r.brand)}</span>
        <span class="cmp1-badge sport">${esc(r.sport)}</span>
      </div>
      <div class="cmp1-delta">${esc(setDelta(r.brand, r.sport))}</div>
    </div>
  `).join('');

  // Light summary madlib (optional)
  const mainSpec = buildLegumePoultryPhrase(mainRow);
  const sdfSpec  = buildLegumePoultryPhrase(sdfRow);
  const madlibEl = document.querySelector('[data-var="section1-madlib"]');
  if (madlibEl) {
    madlibEl.innerHTML =
      `<span class="span-compare-name">${esc(mainRow["data-brand"])} ${esc(mainRow["data-one"])}</span> is a ` +
      `<span class="span-compare-specs">${esc(dietText(mainRow["data-diet"] || mainRow["data-grain"] || ''))}, ${esc(flavorText(mainRow["specs_primary_flavor"] || ''))} formula</span> that’s ` +
      `<span class="span-compare-specs">${esc(mainSpec)}</span>.<br>` +
      `<span class="span-sport-name">${esc(sdfRow["data-one"])}</span> is a ` +
      `<span class="span-sport-specs">${esc(dietText(sdfRow["data-diet"] || sdfRow["data-grain"] || ''))}, ${esc(flavorText(sdfRow["specs_primary_flavor"] || ''))} diet</span> that’s ` +
      `<span class="highlight">${esc(sdfSpec)}</span>.`;
  }
}

// ===========================
// Section 2 (Group 2 + per-row bars)
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

  // visual maxes
  const MAX = { protein: 40, fat: 30, kcals_c: 600, kcals_k: 5500 };
  const pct = (val, max) => Math.max(2, Math.round((val / max) * 100));
  const row = (key, label, unit = '') => {
    const bv = b[key], sv = s[key];
    const diff = sv - bv;
    const diffTxt = isNaN(diff) ? '—' : (diff === 0 ? '±0' : (diff > 0 ? `+${diff}` : `${diff}`));
    const badge = (diff === 0) ? 'Match' : 'Different';
    const badgeCls = (diff === 0) ? 'match' : 'diff';
    const maxKey = key in MAX ? MAX[key] : Math.max(bv, sv) || 1;

    return `
      <div class="cmp2-row" data-key="${esc(key)}">
        <div class="cmp2-label">${esc(label)}</div>

        <div class="cmp2-values">
          <div class="cmp2-badges">
            <span class="cmp2-badge brand">${esc(unit ? `${bv}${unit}` : String(bv))}</span>
            <span class="cmp2-badge sport">${esc(unit ? `${sv}${unit}` : String(sv))}</span>
          </div>

          <div class="cmp2-bars">
            <div class="cmp2-track">
              <div class="cmp2-fill brand" style="width:${pct(bv, maxKey)}%"></div>
              <div class="cmp2-fill sport" style="width:${pct(sv, maxKey)}%"></div>
            </div>
          </div>
        </div>

        <div class="cmp2-diff">${esc(diffTxt)}</div>
        <div class="cmp2-delta ${badgeCls}">${badge}</div>
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
  const esc = (v) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const headerEl = document.querySelector('[data-var="section3-header"]');
  if (headerEl) headerEl.textContent = "Under the Hood";
  const subtitleEl = document.querySelector('[data-var="section3-subtitle"]');
  if (subtitleEl) subtitleEl.textContent = "Let's dig in and see how each ingredient stacks up.";

  const sec3 = document.querySelector('#section-3');
  if (!sec3) return;

  // Scaffold once
  if (!sec3.querySelector('.cmp3')) {
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

  // Totals overlay (compare over sport)
  const rowsRoot = sec3.querySelector('#cmp3-rows');
  const countsB  = getIngredientCategoryCounts(mainRow);
  const countsS  = getIngredientCategoryCounts(sdfRow);

  const overlayRow = (key, label) => {
    const b = countsB[key] ?? 0;
    const s = countsS[key] ?? 0;
    const diff = s - b;
    const diffTxt = diff === 0 ? '±0' : (diff > 0 ? `+${diff}` : `${diff}`);
    const badge = diff === 0 ? 'Match' : 'Different';
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
  const brandNameEl = sec3.querySelector('[data-var="brand-1-sec3-name"]');
  if (brandNameEl) {
    brandNameEl.textContent = mainRow["data-brand"]
      ? `${mainRow["data-brand"]} ${mainRow["data-one"] || ''}`.trim()
      : (mainRow["data-one"] || "");
  }

  const sportNameEl = sec3.querySelector('[data-var="sport-1-sec3-name"]');
  if (sportNameEl) {
    sportNameEl.textContent = `Sport Dog Food ${sdfRow["data-one"] || ''}`.trim();
  }

  // Lists
  const brandListEl = sec3.querySelector('[data-var="brand-1-sec3-inglist"]');
  if (brandListEl) brandListEl.innerHTML = renderIngListDivs(mainRow);
  const sportListEl = sec3.querySelector('[data-var="sport-1-sec3-inglist"]');
  if (sportListEl) sportListEl.innerHTML = renderIngListDivs(sdfRow);

  // Modal
  ensureIngSearchModal();
  const openBtn = sec3.querySelector('#open-ing-search');
  if (openBtn && !openBtn._wired) {
    openBtn._wired = true;
    openBtn.addEventListener('click', () => {
      const modal = ensureIngSearchModal();
      modal.classList.add('open');
      const mount = modal.querySelector('.pwrf-filter-wrapper');
      if (mount) paintDualIngredientLists(mainRow, sdfRow, mount);
    });
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
} // <-- closes paintSection3

// ---- Modal shell (module-scope, idempotent) ----
function ensureIngSearchModal() {
  let modal = document.getElementById('ing-search-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'ing-search-modal';
  modal.className = 'cmp3-modal';
  modal.innerHTML = `
    <div class="cmp3-modal__backdrop" data-close="1"></div>
    <div class="cmp3-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ing-search-title">
      <div class="cmp3-modal__head">
        <h3 id="ing-search-title">Search Ingredients</h3>
        <button class="cmp3-btn cmp3-modal__close" data-close="1" aria-label="Close" type="button">×</button>
      </div>
      <div class="cmp3-modal__body">
        <div class="pwrf-filter-wrapper"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // close on backdrop/X
  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close === '1') modal.classList.remove('open');
  });

  // close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('open');
  });

  return modal;
}


// ===========================
// Ingredient list + search
// ===========================
function renderIngListDivs(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  return `
    <div class="ci-ings-list">
      ${ings.map(ing => {
        const display = esc(ing.displayAs || ing.Name || '');
        const tags = [];
        if (ing["data-type"]) {
          const tag = getConsumerTypeTag(ing["data-type"]);
          tags.push(`<div class="ci-ing-tag ci-tag-default ci-tag-${esc(tag.toLowerCase())}">${esc(tag)}</div>`);
        }
        if (ing.tagPoultry)     tags.push(`<div class="ci-ing-tag ci-tag-poultry" title="Poultry" aria-label="Poultry"></div>`);
        if (ing.tagAllergy)     tags.push(`<div class="ci-ing-tag ci-tag-allergy" title="Allergy" aria-label="Allergy"></div>`);
        if (ing.tagContentious) tags.push(`<div class="ci-ing-tag ci-tag-contentious" title="Contentious" aria-label="Contentious"></div>`);
        if (ing.supplementalType === "Minerals")   tags.push(`<div class="ci-ing-tag ci-tag-mineral">mineral</div>`);
        if (ing.supplementalType === "Vitamins")   tags.push(`<div class="ci-ing-tag ci-tag-vitamin">vitamin</div>`);
        if (ing.supplementalType === "Probiotics") tags.push(`<div class="ci-ing-tag ci-tag-probiotic">probiotic</div>`);
        const assist = (ing.supplementalAssist || '').toLowerCase();
        if (assist.includes('chelate') || assist.includes('complex')) {
          tags.push(`<div class="ci-ing-tag ci-tag-upgraded">upgraded mineral</div>`);
        }
        return `
          <div class="ci-ing-wrapper">
            <div class="ci-ing-displayas">${display}</div>
            <div class="ci-ing-tag-wrapper hide-scrollbar">${tags.join("")}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}



function paintDualIngredientLists(mainRow, sdfRow, mountEl) {
  function getIngredients(row) {
    const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
    return ids.map(id => ING_MAP[id]).filter(Boolean);
  }

  function renderList(ings, title, groupId) {
    return `
      <div class="pwrf-list-group" data-list="${groupId}">
        <div class="pwrf_list-title">${esc(title)}</div>
        ${ings.map(ing => {
          const searchVal = [
            ing.Name,
            ing.displayAs,
            ing.groupWith,
            ing["data-type"]       || "",
            ing.recordType         || "",
            ing.animalType         || "",
            ing.animalAssist       || "",
            ing.plantType          || "",
            ing.plantAssist        || "",
            ing.supplementalType   || "",
            ing.supplementalAssist || "",
            ...(ing.tags || [])
          ].join(" ").toLowerCase();

          return `
            <div class="pwrf_dropdown-item" data-search="${esc(searchVal)}">
              <span class="pwrf_item-name">${esc(ing.displayAs || ing.Name || '')}</span>
            </div>
          `;
        }).join("")}
        <div class="pwrf_no-results" style="display:none;">No ${esc(title.toLowerCase())} found.</div>
      </div>
    `;
  }

  // Find or create mount point
  let wrapper = mountEl || document.querySelector(".pwrf-filter-wrapper");
  if (!wrapper) {
    const sec3 = document.querySelector("#section-3");
    if (!sec3) return; // nowhere to put it
    wrapper = document.createElement("div");
    wrapper.className = "pwrf-filter-wrapper";
    sec3.appendChild(wrapper);
  }

  wrapper.innerHTML = `
    <div class="pwrf_searchbar" role="search">
      <input type="text" class="pwrf_search-input" placeholder="Search ingredients…" aria-label="Search ingredients"/>
      <button class="pwrf_clear-btn" style="display:none" type="button">Clear</button>
    </div>
    <div class="pwrf_results" aria-live="polite">
      ${renderList(getIngredients(mainRow), mainRow["data-brand"] || "Competitor", 1)}
      ${renderList(getIngredients(sdfRow), "Sport Dog Food", 2)}
    </div>
  `;

  const input    = wrapper.querySelector(".pwrf_search-input");
  const clearBtn = wrapper.querySelector(".pwrf_clear-btn");
  const groups   = Array.from(wrapper.querySelectorAll(".pwrf-list-group")).map(el => ({
    container: el,
    items: Array.from(el.querySelectorAll(".pwrf_dropdown-item")),
    noResults: el.querySelector(".pwrf_no-results")
  }));

  function filterNow() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
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
        for (const it of g.items) {
          const ok = it.dataset.search.includes(q);
          it.style.display = ok ? "" : "none";
          if (ok) any = true;
        }
        g.noResults.style.display = any ? "none" : "";
      });
    }
  }

  // light debounce so typing feels smooth
  let to = 0;
  const debounced = () => { clearTimeout(to); to = setTimeout(() => requestAnimationFrame(filterNow), 120); };

  input.addEventListener("input", debounced);
  clearBtn.addEventListener("click", (e) => { e.preventDefault(); input.value = ""; filterNow(); });

  // initialize hidden
  filterNow();
}


// ===========================
// Lazy-load sections (single IO)
// ===========================
function lazyLoadCompareSections(mainRow, sdfRow) {
  const tasks = new Map([
    ['#section-1', () => { paintSection1(mainRow, sdfRow); /* runTypedForMadlib('section1-madlib') if re-enabled */ }],
    ['#section-2', () => { paintSection2(mainRow, sdfRow); /* runTypedForMadlib('section2-madlib') */ }],
    ['#section-3', () => {
      paintSection3(mainRow, sdfRow);
      // Typed slots (disabled by default)
      // ['section3-madlib','section3-sport-madlib','section3-contentious-madlib','section3-sport-contentious-madlib'].forEach(runTypedForMadlib);
      // DO NOT pre-render dual search here; it renders on modal open
    }],
    ['#section-k', () => {
      if (typeof paintSectionK === 'function') {
        paintSectionK(mainRow, [
          getCiRow(SDF_FORMULAS.cub),
          getCiRow(SDF_FORMULAS.dock),
          getCiRow(SDF_FORMULAS.herding)
        ]);
      }
    }]
  ]);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const fn = tasks.get('#' + e.target.id);
      if (fn) fn();
      io.unobserve(e.target);
    });
  }, { root: null, rootMargin: '0px 0px -30% 0px', threshold: 0.1 });

  tasks.forEach((_, sel) => {
    const el = document.querySelector(sel);
    if (el) io.observe(el);
  });
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

  // Lazy-load sections
  lazyLoadCompareSections(mainRow, initialRow);

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

        params.set('sdf', newId);
        window.history.replaceState({}, '', `${location.pathname}?${params}`);

        const newRow = getCiRow(newId);
        window.CCI.sdfRow = newRow;

        if (typeof renderStickyCompareHeader === 'function') {
          renderStickyCompareHeader(mainRow, newRow);
        }

        paintSection1(mainRow, newRow);
        paintSection2(mainRow, newRow);
        paintSection3(mainRow, newRow);

        // If Section K shown on page, refresh
        if (typeof paintSectionK === 'function') {
          paintSectionK(mainRow, [
            getCiRow(SDF_FORMULAS.cub),
            getCiRow(SDF_FORMULAS.dock),
            getCiRow(SDF_FORMULAS.herding)
          ]);
        }

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
