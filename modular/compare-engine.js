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
const RAW_ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
const ING_MAP = Object.fromEntries(
  Object.entries(RAW_ING_MAP).map(([id, ing]) => [
    id,
    {
      ...ing,
      // normalize new fields (use empty string if not provided in the source)
      ['cont-cf-explain-contentious']: ing['cont-cf-explain-contentious'] ?? '',
      termDescription: ing.termDescription ?? ''
    }
  ])
);

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
// -- small util for [data-var="..."] hooks
function setVarText(varName, text) {
  const el = document.querySelector(`[data-var="${varName}"]`);
  if (el) el.textContent = String(text ?? '');
}

// --- Hoisted helpers (file-scope so they're always available) ---
function dietText(v) {
  if (!v) return '—';
  return /free/i.test(v) ? 'Grain-Free'
       : /grain/i.test(v) ? 'Grain Inclusive'
       : '—';
}
function legumesText(v) {
  if (!v) return '—';
  return /(free|no)/i.test(v) ? 'Legume-Free'
       : /legume|pea/i.test(v) ? 'Contains Legumes'
       : '—';
}
function poultryText(v) {
  if (!v) return '—';
  return /(free|no)/i.test(v) ? 'Poultry-Free'
       : /poultry|chicken/i.test(v) ? 'Contains Poultry'
       : '—';
}
function flavorText(v) {
  if (!v) return '—';
  return /\b(chicken|poultry)\b/i.test(v) ? 'Poultry'
       : /\b(beef)\b/i.test(v)            ? 'Beef'
       : /\b(fish|salmon)\b/i.test(v)     ? 'Fish'
       : /\b(bison|buffalo)\b/i.test(v)   ? 'Buffalo'
       : /\bmeat\b/i.test(v)              ? 'Meat'
       : '—';
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
// Decide background classes per kind/value/side
function bgClassFor(kind, side, txt){
  const sideTone = (side === 'A') ? '1' : '2'; // A=competitor, B=sport
  const t = (txt || '').toLowerCase();

  if (kind === 'diet')     return `bg-diet-${sideTone}`;
  if (kind === 'legumes')  return `bg-legumes-${sideTone}`;
  if (kind === 'poultry')  return `bg-poultry-${sideTone}`;

  if (kind === 'flavor') {
    if (/\b(poultry|chicken)\b/.test(t)) return 'bg-protein-poultry';
    if (/\b(beef|meat|buffalo|bison)\b/.test(t)) return 'bg-protein-beef';
    if (/\b(fish|salmon)\b/.test(t)) return 'bg-protein-fish';
    return 'bg-protein-unknown';
  }
  return '';
}
// State-based shade class for Section 1 icons (no column suffixes)
function shadeClassFor(kind, txt) {
  const t = String(txt || '').toLowerCase();

  // Diet (grain)
  if (kind === 'diet') {
    if (/free/.test(t))  return 'shade-grain-free';
    if (/grain/.test(t)) return 'shade-grain';
    return '';
  }

  // Legumes
  if (kind === 'legumes') {
    return /(free|no)/.test(t) ? 'shade-legumes-free' : 'shade-legumes';
  }

  // Poultry
  if (kind === 'poultry') {
    return /(free|no)/.test(t) ? 'shade-poultry-free' : 'shade-poultry';
  }

  // Primary Protein (aka "flavor")
  if (kind === 'flavor') {
    if (/\b(poultry|chicken)\b/.test(t))  return 'shade-protein-poultry';
    if (/\b(beef)\b/.test(t))             return 'shade-protein-beef';
    if (/\b(fish|salmon)\b/.test(t))      return 'shade-protein-fish';
    if (/\b(bison|buffalo)\b/.test(t))    return 'shade-protein-buffalo';
    if (/\bmeat\b/.test(t))               return 'shade-protein-meat';
    return 'shade-protein-unknown';
  }

  return '';
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
// Ensures generic + (optional) contentious empty cards exist in a list container
function appendEmptyCards(listContainer, { general, contentious }) {
  if (!listContainer) return;

  const ensure = (cls, text) => {
    let el = listContainer.querySelector(`.${cls}`);
    if (!el) {
      el = document.createElement('div');
      el.className = cls;
      el.hidden = true;
      el.style.display = 'none';
      el.textContent = text || 'No results.';
      listContainer.appendChild(el);
    }
    return el;
  };

  if (general)     ensure('ci-no-results', general);
  if (contentious) ensure('ci-no-results-contentious', contentious);
}

// ---- Section-1 text helpers (unique names; no chance of collision) ----
function s1DietText(v) {
  if (!v) return '—';
  return /free/i.test(v) ? 'Grain-Free'
       : /grain/i.test(v) ? 'Grain Inclusive'
       : '—';
}
function s1LegumesText(v) {
  if (!v) return '—';
  return /(free|no)/i.test(v) ? 'Legume-Free'
       : /legume|pea/i.test(v) ? 'Contains Legumes'
       : '—';
}
function s1PoultryText(v) {
  if (!v) return '—';
  return /(free|no)/i.test(v) ? 'Poultry-Free'
       : /poultry|chicken/i.test(v) ? 'Contains Poultry'
       : '—';
}
function s1FlavorText(v) {
  if (!v) return '—';
  return /\b(chicken|poultry)\b/i.test(v) ? 'Poultry'
       : /\b(beef)\b/i.test(v)            ? 'Beef'
       : /\b(fish|salmon)\b/i.test(v)     ? 'Fish'
       : /\b(bison|buffalo)\b/i.test(v)   ? 'Buffalo'
       : /\bmeat\b/i.test(v)              ? 'Meat'
       : '—';
}


// ===========================
// Scaffold V2 (nested containers) — with styling classes
// ===========================
export function initCompareScaffoldV2() {
  const $ = (s) => document.querySelector(s);
  const insertAfter = (ref, el) => {
    if (ref && ref.parentNode) ref.parentNode.insertBefore(el, ref.nextSibling);
  };

  // ensure sticky grid lives INSIDE #compare-sticky
  let stickyHost = $('#compare-sticky');
  if (!stickyHost) {
    stickyHost = document.createElement('section');
    stickyHost.id = 'compare-sticky';
    document.body.insertBefore(stickyHost, document.body.firstChild);
  }
  let stickyWrap = stickyHost.querySelector('.pwr10-rows-grid.sticky-sections');
  if (!stickyWrap) {
    stickyWrap = document.createElement('div');
    stickyWrap.className = 'pwr10-rows-grid sticky-sections';
    stickyHost.appendChild(stickyWrap);
  }

  // helper: ensure a container by id, placed after a reference selector
// helper: ensure a container by id, placed after a reference selector
// Parent strategy:
//  1) use the anchor's parent (afterSel)
//  2) else use the parent of an existing PWR10 section (S2, then S1, then sticky)
//  3) else fallback to document.body
const ensureContainer = (id, afterSel) => {
  let el = document.getElementById(id);
  let after = afterSel ? document.querySelector(afterSel) : null;

  const pickParent = () => {
    if (after && after.parentNode) return after.parentNode;
    const sibIds = ['pwr10-section2', 'pwr10-section1', 'compare-sticky'];
    for (const sid of sibIds) {
      const sib = document.getElementById(sid);
      if (sib && sib.parentNode) return sib.parentNode;
    }
    return document.body;
  };

  const parent = pickParent();
  const ref = after ? after.nextSibling : null;

  if (!el) {
    el = document.createElement('div');
    el.id = id;
    parent.insertBefore(el, ref);
    return el;
  }

  // Normalize location/order if it already exists
  if (el.parentNode !== parent) {
    parent.insertBefore(el, ref);
  } else if (after && el.previousSibling !== after) {
    parent.insertBefore(el, ref);
  }

  return el;
};


  // helper: ensure a grid inside a parent, with classes + id
  const ensureGridIn = (parent, cls, id) => {
    if (!parent) return null;
    let grid = (id && parent.querySelector('#' + id)) || parent.querySelector(`.pwr10-rows-grid.${cls}`);
    if (!grid) {
      grid = document.createElement('div');
      grid.className = `pwr10-rows-grid ${cls}`;
      if (id) grid.id = id;
      parent.appendChild(grid);
    } else {
      grid.classList.add('pwr10-rows-grid', cls);
      if (id && !grid.id) grid.id = id;
    }
    return grid;
  };

  // ---------- NEW: helper to compute classes for each data-var ----------
  const classesForVar = (name) => {
    const role =
      /-header$/.test(name)   ? ['pwr-title', 'pwr10-title'] :
      /-subtitle$/.test(name) ? ['pwr-subtitle', 'pwr10-subtitle'] :
      /-madlib$/.test(name)   ? ['pwr-madlib', 'pwr10-madlib'] : [];
    const m = name.match(/^section(\d+|k)-/i);
    const scope = m ? String(m[1]).toLowerCase() : null;
    const scopeCls = scope ? [`scope-s${scope}`] : [];
    const varHandle = [`var-${name}`, name];
    return [...role, ...scopeCls, ...varHandle];
  };

  // ---------- NEW: ensureVar adds the styling classes ----------
  const ensureVar = (name, parent) => {
    let el = document.querySelector(`[data-var="${name}"]`);
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-var', name);
    }
    classesForVar(name).forEach(c => el.classList.add(c));
    if (parent && !parent.contains(el)) parent.appendChild(el);
    return el;
  };

  // SECTION 1
  const s1 = ensureContainer('pwr10-section1', '#compare-sticky');
  const s1Title = ensureGridIn(s1, 'section1-title', 'pwr10-section1-title');
  const s1Grid  = ensureGridIn(s1, 'section1',       'pwr10-section1-grid');
  s1Title.classList.add('pwr10-titlebar', 'pwr10-titlebar--s1', 'scope-s1');

  // SECTION 2
  const s2 = ensureContainer('pwr10-section2', '#pwr10-section1');
  const s2Title = ensureGridIn(s2, 'section2-title', 'pwr10-section2-title');
  const s2Grid  = ensureGridIn(s2, 'section2',       'pwr10-section2-grid');
  s2Title.classList.add('pwr10-titlebar', 'pwr10-titlebar--s2', 'scope-s2');

  // SECTION 3 — keep titles as direct-children for CSS compatibility; single #section-3
// SECTION 3 — mount into explicit anchor if present, otherwise move there when it appears
const S3_ANCHOR_SEL = '#pwr10-s3-anchor';

// Create/find the Section 3 outer container as usual
const s3 = ensureContainer('pwr10-section3', '#pwr10-section2');

// If someone accidentally styled the outer wrapper as the CE container, neutralize it
s3.classList.remove('pwr10-ce-cont');

// If the anchor exists now, mount S3 inside it; otherwise, wait and move it when it appears
(function ensureS3InAnchor() {
  const anchor = document.querySelector(S3_ANCHOR_SEL);
  if (anchor) {
    if (s3.parentNode !== anchor) anchor.appendChild(s3);
    return; // we're done
  }
  // Anchor not in DOM yet — watch for it, then move S3 once and stop
  const mo = new MutationObserver(() => {
    const a = document.querySelector(S3_ANCHOR_SEL);
    if (!a) return;
    a.appendChild(s3);
    mo.disconnect();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

// Proceed to build the grid/CE inside S3 as you already do
const s3Grid = ensureGridIn(s3, 'section3', 'pwr10-section3-grid');
s3Grid.classList.add('scope-s3');

// ----- CE container + single #section-3 (unchanged below this line)
let ceCont = s3Grid.querySelector('.pwr10-ce-cont');
if (!ceCont) {
  ceCont = document.createElement('div');
  ceCont.className = 'pwr10-ce-cont';
  s3Grid.appendChild(ceCont);
}

const sec3All = Array.from(document.querySelectorAll('#section-3'));
let sec3 = sec3All[0] || null;
if (sec3All.length > 1) sec3All.slice(1).forEach(n => n.remove());
if (!sec3) { sec3 = document.createElement('section'); sec3.id = 'section-3'; }
sec3.classList.add('pwr10-ce');
if (sec3.parentNode !== ceCont) ceCont.appendChild(sec3);

// titles as direct children (keep your existing ensureVarCompat calls, etc) …


  // ----- Titles as DIRECT CHILDREN of the grid (no wrapper dependency)
  const ensureVarCompat = (name) => {
    let el = document.querySelector(`[data-var="${name}"]`);
    if (!el) { el = document.createElement('div'); el.setAttribute('data-var', name); }
    if (/-header$/.test(name))   el.classList.add('pwr-title','pwr10-title');
    if (/-subtitle$/.test(name)) el.classList.add('pwr-subtitle','pwr10-subtitle');
    if (/-madlib$/.test(name))   el.classList.add('pwr-madlib','pwr10-madlib');
    el.classList.add('scope-s3', `var-${name}`, name);
    if (el.parentNode !== s3Grid || el.nextElementSibling !== ceCont) {
      s3Grid.insertBefore(el, ceCont);
    }
    return el;
  };

  // S1/S2 title buckets (unchanged location; just ensure classes)
  const ensureVarNoMove = (name, parent) => {
    let el = document.querySelector(`[data-var="${name}"]`);
    if (!el) { el = document.createElement('div'); el.setAttribute('data-var', name); parent && parent.appendChild(el); }
    if (/-header$/.test(name))   el.classList.add('pwr-title','pwr10-title');
    if (/-subtitle$/.test(name)) el.classList.add('pwr-subtitle','pwr10-subtitle');
    if (/-madlib$/.test(name))   el.classList.add('pwr-madlib','pwr10-madlib');
    if (/^section1-/.test(name)) el.classList.add('scope-s1');
    if (/^section2-/.test(name)) el.classList.add('scope-s2');
    el.classList.add(`var-${name}`, name);
    return el;
  };

  ensureVarNoMove('section1-header',   s1Title);
  ensureVarNoMove('section1-subtitle', s1Title);
  ensureVarNoMove('section1-madlib',   s1Title);

  ensureVarNoMove('section2-header',   s2Title);
  ensureVarNoMove('section2-subtitle', s2Title);
  ensureVarNoMove('section2-madlib',   s2Title);

  // Section 3 titles: direct children (compat)
  ensureVarCompat('section3-header');
  ensureVarCompat('section3-subtitle');
  ensureVarCompat('section3-madlib');

  // Remove any now-empty wrapper we may have created earlier (optional)
  const oldWrap = s3Grid.querySelector('.pwr10-varwrap');
  if (oldWrap && oldWrap.children.length === 0) oldWrap.remove();

  // Optional Section K (unchanged)
  let kWrap = s3.nextElementSibling;
  if (!(kWrap && kWrap.classList.contains('pwr10-varwrap-k'))) {
    kWrap = document.createElement('div');
    kWrap.className = 'pwr10-varwrap pwr10-varwrap-k';
    insertAfter(s3, kWrap);
  }
  ensureVarNoMove('sectionk-header', kWrap);
  ensureVarNoMove('sectionk-madlib', kWrap);

  // return includes s3Varwrap: null for backward compatibility with old callers
  return { stickyWrap, s1, s1Title, s1Grid, s2, s2Title, s2Grid, s3, s3Grid, s3Varwrap: null, sec3 };
}


// ===========================
// Sticky header (PWR10 markup)
// ===========================

export function renderStickyCompareHeader(mainRow, sdfRow, containerSelector = '#compare-sticky') {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  // Ensure the scaffold exists (sticky + section buckets)
// Use the grid created by initCompareScaffold (create if missing)
let stickyWrap = mount.querySelector('.pwr10-rows-grid.sticky-sections');
if (!stickyWrap) {
  stickyWrap = document.createElement('div');
  stickyWrap.className = 'pwr10-rows-grid sticky-sections';
  mount.appendChild(stickyWrap);
}

  const brandName  = (mainRow['data-brand'] || 'Competitor').trim();
  const brandProd  = (mainRow['data-one']   || '').trim();
  const sportBrand = 'SPORT DOG FOOD';
  const sportProd  = (sdfRow['data-one']    || '').trim();

  // (Re)paint sticky row
  let stickyRow = stickyWrap.querySelector('#pwr10-sticky-row');
  if (stickyRow) stickyRow.remove();

  stickyRow = document.createElement('div');
  stickyRow.id = 'pwr10-sticky-row';
  stickyRow.className = 'w-layout-grid pwr10-row-grid pwr10-sticky';
  stickyRow.innerHTML = `
      <!-- Left rail label -->
      <div class="pwr10-row-label">
        <div class="pwr10-row-label2"><div>Compare</div></div>
      </div>

      <div class="pwr10-vertical-divider"></div>

      <!-- Competitor column -->
      <div class="pwr10-row-value">
        <div class="pwr10-row-mobile-name"><div>${esc(brandName.toUpperCase())} ${esc(brandProd)}</div></div>
        <div class="pwr10-row-input">
          <div class="pwr10-icon">
            <div class="cmp-head-img lazy-bg" aria-hidden="true"></div>
          </div>
          <div class="pwr10-title section-sticky">
            <div class="cmp-head-brand">${esc(brandName.toUpperCase())}</div>
            <div class="cmp-head-name">${esc(brandProd)}</div>
          </div>
        </div>
        <div class="pwr10-row-input-label"><div>Compare</div></div>
      </div>

      <div class="pwr10-vertical-divider mobile"></div>

      <!-- Sport column -->
      <div class="pwr10-row-value">
        <div class="pwr10-row-mobile-name"><div>${esc(sportBrand)} ${esc(sportProd)}</div></div>
        <div class="pwr10-row-input">
          <div class="pwr10-icon">
            <div class="cmp-head-img lazy-bg" aria-hidden="true"></div>
          </div>
          <div class="pwr10-title section-sticky">
            <div class="cmp-head-brand">${esc(sportBrand)}</div>
            <div class="cmp-head-name">${esc(sportProd)}</div>
          </div>
        </div>
        <div class="pwr10-row-input-label"><div>Sport</div></div>
      </div>
  `;
  stickyWrap.appendChild(stickyRow);

  // Set lazy bg images
  const imgs = stickyRow.querySelectorAll('.cmp-head-img');
  if (imgs[0] && mainRow.previewengine) setLazyBackground(imgs[0], mainRow.previewengine);
  if (imgs[1] && sdfRow.previewengine)  setLazyBackground(imgs[1],  sdfRow.previewengine);
}




// Paint a placeholder into .pwr10-rows-grid.section1-title (no visible title row)
function paintPwr10HeaderRow(mainRow, sdfRow) {
  const grid = document.querySelector('.pwr10-rows-grid.section1-title');
  if (!grid) return;

  // remove prior injected row/placeholder if re-rendering
  const priorRow = grid.querySelector('#pwr10-section1-title-row');
  if (priorRow) priorRow.remove();
  const priorPh = grid.querySelector('#pwr10-section1-placeholder');
  if (priorPh) priorPh.remove();

  // add a hidden placeholder so the bucket exists for future content
  const ph = document.createElement('div');
  ph.id = 'pwr10-section1-placeholder';
  ph.className = 'w-layout-grid pwr10-row-grid section1-title-placeholder';
  ph.setAttribute('aria-hidden', 'true');
  grid.appendChild(ph);
}


function pwr10DeltaBadgePair(a, c) {
  const d = Number(c) - Number(a);
  const sportCls = d === 0 ? 'same' : (d > 0 ? 'pos' : 'neg');
  const compCls  = d === 0 ? 'same' : (d > 0 ? 'neg' : 'pos'); // inverse
  const txt = d === 0 ? '±0' : (d > 0 ? `+${d}` : `${d}`);
  const icon = (cls) => cls==='same'
    ? '<svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h14"/></svg>'
    : (cls==='pos'
        ? '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>');
  const mk = (cls, aria) => `<span class="cmp-delta-badge ${cls}" aria-label="${esc(aria)}">${icon(cls)}<span>${esc(txt)}</span></span>`;
  return {
    comp:  mk(compCls,  d === 0 ? 'No difference' : `Competitor difference ${txt}`),
    sport: mk(sportCls, d === 0 ? 'No difference' : `Sport difference ${txt}`),
  };
}

function pwr10DeltaBadge(a, c) {
  const d = Number(c) - Number(a);
  const cls = d === 0 ? 'same' : (d > 0 ? 'pos' : 'neg');
  const txt = d === 0 ? '±0' : (d > 0 ? `+${d}` : `${d}`);
  const aria = d === 0 ? 'No difference' : `Difference ${txt}`;
  const icon = (cls === 'same')
    ? '<svg viewBox="0 0 24 24"><path d="M5 9h14M5 15h14"/></svg>'
    : (cls === 'pos'
        ? '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>');
  return `<span class="cmp-delta-badge ${cls}" aria-label="${esc(aria)}">${icon}<span>${esc(txt)}</span></span>`;
}

// helper: allow an optional extra class for the pill
function pwr10CmpMatchBadge(aTxt, bTxt, extraClass = '') {
  const isMatch = (String(aTxt||'').toLowerCase() === String(bTxt||'').toLowerCase());
  const iconEq = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>`;
  const iconNe = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 15h14M4 4l16 16"/></svg>`;
  const label = isMatch ? 'Match' : 'Diff';
  const cls = isMatch ? 'match' : 'diff';
  const extra = extraClass ? ` ${extraClass}` : '';
  return `<span class="cmp-match ${cls}${extra}" aria-label="Attributes ${esc(label)}">${isMatch ? iconEq : iconNe}<span class="cmp-match-txt">${esc(label)}</span></span>`;
}



// ===========================
// Section 1 (exact row markup)
// ===========================
export function paintSection1(mainRow, sdfRow, sectionSelector = '#section-1') {
  const compFull  = `${(mainRow['data-brand'] || 'Competitor')} — ${(mainRow['data-one'] || '').trim()}`.trim();
  const sportFull = `Sport Dog Food — ${(sdfRow['data-one'] || '').trim()}`.trim();

  // ---- Section 1 header + subtitle + madlib (optional hooks) ----
  const brand     = (mainRow['data-brand'] || 'Competitor').trim();
  const brandName = (mainRow['data-one'] || '').trim();
  const sdfName   = (sdfRow['data-one']  || '').trim();

  setVarText('section1-header', 'Formula Basics');
  setVarText(
    'section1-subtitle',
    `Diet, legumes, poultry, and primary protein for ${brand} ${brandName} vs. Sport Dog Food ${sdfName}.`
  );

  const lhsDiet   = s1DietText(mainRow['data-diet'] || mainRow['data-grain'] || '');
  const rhsDiet   = s1DietText(sdfRow['data-diet']  || sdfRow['data-grain']  || '');
  const lhsLP     = buildLegumePoultryPhrase(mainRow);
  const rhsLP     = buildLegumePoultryPhrase(sdfRow);
  const lhsFlavor = s1FlavorText(mainRow['specs_primary_flavor'] || '');
  const rhsFlavor = s1FlavorText(sdfRow['specs_primary_flavor']  || '');

  const rows = [
    { label:'Diet',            aTxt: s1DietText(mainRow['data-diet'] || mainRow['data-grain'] || ''), bTxt: s1DietText(sdfRow['data-diet'] || sdfRow['data-grain'] || ''), kind:'diet' },
    { label:'Legumes',         aTxt: s1LegumesText(mainRow['data-legumes'] || ''),                     bTxt: s1LegumesText(sdfRow['data-legumes'] || ''),                     kind:'legumes' },
    { label:'Poultry',         aTxt: s1PoultryText(mainRow['data-poultry'] || ''),                     bTxt: s1PoultryText(sdfRow['data-poultry'] || ''),                     kind:'poultry' },
    { label:'Primary Protein', aTxt: s1FlavorText(mainRow['specs_primary_flavor'] || ''),              bTxt: s1FlavorText(sdfRow['specs_primary_flavor'] || ''),              kind:'flavor' }
  ];

  setVarText(
    'section1-madlib',
    `${brand} ${brandName}: ${lhsDiet}, ${lhsLP}; primary protein: ${lhsFlavor}. ` +
    `Sport Dog Food ${sdfName}: ${rhsDiet}, ${rhsLP}; primary protein: ${rhsFlavor}.`
  );

  // --- ICON LIB + helpers (same assets you already use) ---
  const ICONS = {
    poultry: `${CDN}/688e4fa168bfe5b6f24adf2e_poultry.svg`,
    legumes: `${CDN}/688e4f9f149ae9bbfc330912_peas-sm.svg`,
    grain:   `${CDN}/688e4f97f058589e135de78d_grain-sm.svg`,
    flavor: {
      poultry: `${CDN}/688e4fa168bfe5b6f24adf2e_poultry.svg`,
      beef:    `${CDN}/688e4f91a8deee5cc246d0be_beef-sm.svg`,
      meat:    `${CDN}/688e4f91a8deee5cc246d0be_beef-sm.svg`,
      fish:    `${CDN}/688c1f5e4633f104d7ea1658_Untitled%20(6%20x%206%20in)%20(70%20x%2070%20px).svg`,
      buffalo: `${CDN}/688e4f91f9ebb5f9cadc8af7_buffalo-sm.svg`
    }
  };

  function iconWrap(src, cls, { slash } = {}) {
    return `
      <div class="icon-wrapper">
        <img src="${src}" loading="lazy" alt="" class="${cls}">
        ${slash ? `
          <svg class="icon-slash" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line x1="12" y1="88" x2="88" y2="12"></line>
          </svg>
        ` : ''}
      </div>
    `;
  }

  function renderAttrIcon(kind, txt) {
    const t = String(txt || '').toLowerCase();
    if (kind === 'diet')    { const isFree = /free/.test(t); return iconWrap(ICONS.grain,   isFree ? 'icon-grain_free'   : 'icon-grain_in',   { slash: isFree }); }
    if (kind === 'legumes') { const isFree = /(free|no)/.test(t); return iconWrap(ICONS.legumes, isFree ? 'icon-legumes-free' : 'icon-legumes', { slash: isFree }); }
    if (kind === 'poultry') { const isFree = /(free|no)/.test(t); return iconWrap(ICONS.poultry, isFree ? 'icon-poultry-free' : 'icon-poultry', { slash: isFree }); }
    if (kind === 'flavor') {
      let key = 'meat';
      if (/\b(poultry|chicken)\b/.test(t)) key = 'poultry';
      else if (/\b(beef)\b/.test(t))       key = 'beef';
      else if (/\b(fish|salmon)\b/.test(t)) key = 'fish';
      else if (/\b(bison|buffalo)\b/.test(t)) key = 'buffalo';
      return iconWrap(ICONS.flavor[key], `icon-flavor-${key}`, { slash: false });
    }
    return '';
  }

  function getMatchBadge(aTxt, bTxt) {
    const isMatch = (String(aTxt||'').toLowerCase() === String(bTxt||'').toLowerCase());
    const iconEq = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>`;
    const iconNe = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 9h14M5 15h14M4 4l16 16"/></svg>`;
    const label = isMatch ? 'Match' : 'Different';
    const cls = isMatch ? 'match' : 'diff';
    return `<span class="cmp-match ${cls}" aria-label="Attributes ${esc(label)}">${isMatch ? iconEq : iconNe}<span class="cmp-match-txt">${esc(label)}</span></span>`;
  }

  // ---- Classic Section 1 is OPTIONAL
  const mount = document.querySelector(sectionSelector);
  if (mount) {
    let rowsSec = mount.querySelector(':scope > section.rows');
    if (!rowsSec) {
      rowsSec = document.createElement('section');
      rowsSec.className = 'rows';
      rowsSec.setAttribute('aria-label', 'Attribute comparison');
      mount.appendChild(rowsSec);
    }
    rowsSec.innerHTML = rows.map((r) => {
      const aIcon = renderAttrIcon(r.kind, r.aTxt);
      const bIcon = renderAttrIcon(r.kind, r.bTxt);
      const badge = getMatchBadge(r.aTxt, r.bTxt);
      return `
        <div class="row">
          <div class="label">${esc(r.label)}</div>
          <div class="value valueA" data-col="${esc(compFull)}">
            ${aIcon}
            <span class="txt">${esc(r.aTxt)}</span>
            <span class="status">${badge}</span>
          </div>
          <div class="value valueB" data-col="${esc(sportFull)}">
            ${bIcon}
            <span class="txt">${esc(r.bTxt)}</span>
            <span class="status">${badge}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---- PWR10 mirror (always runs)
  try {
  const grid =
  document.querySelector('#pwr10-section1-grid') ||
  document.querySelector('#pwr10-section1 .pwr10-rows-grid.section1') ||
  document.querySelector('#pwr10-section1') ||
  document.querySelector('.pwr10-rows-grid.section1');
    if (!grid) return;

    const compShort  = `${(mainRow['data-brand'] || 'Competitor')} ${mainRow['data-one'] || ''}`.trim();
    const sportShort = `Sport Dog Food ${sdfRow['data-one'] || ''}`.trim();

    rows.forEach((r, idx) => {
      const prior = grid.querySelector(`#pwr10-s1-${idx}`);
      if (prior) prior.remove();

      const aShade = shadeClassFor(r.kind, r.aTxt);
      const bShade = shadeClassFor(r.kind, r.bTxt);

      const badgeHTML = (pwr10CmpMatchBadge.length >= 3)
        ? pwr10CmpMatchBadge(r.aTxt, r.bTxt, 'section1')
        : pwr10CmpMatchBadge(r.aTxt, r.bTxt).replace('cmp-match ', 'cmp-match section1 ');

      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div id="pwr10-s1-${idx}" class="w-layout-grid pwr10-row-grid section1">
          <div class="pwr10-row-label"><div class="pwr10-row-label2"><div>${esc(r.label)}</div></div></div>
          <div class="pwr10-vertical-divider"></div>

          <div class="pwr10-row-value">
            <div class="pwr10-row-mobile-name"><div>${esc(compShort)}</div></div>
            <div class="pwr10-row-input">
              <div class="pwr10-icon ${aShade}">${renderAttrIcon(r.kind, r.aTxt)}</div>
              <div class="pwr10-title section11"><div>${esc(r.aTxt)}</div></div>
              ${badgeHTML}
            </div>
            <div class="pwr10-row-input-label"><div>${esc(r.label)}</div></div>
          </div>

          <div class="pwr10-vertical-divider mobile"></div>

          <div class="pwr10-row-value">
            <div class="pwr10-row-mobile-name"><div>${esc(sportShort)}</div></div>
            <div class="pwr10-row-input">
              <div class="pwr10-icon ${bShade}">${renderAttrIcon(r.kind, r.bTxt)}</div>
              <div class="pwr10-title section11"><div>${esc(r.bTxt)}</div></div>
              ${badgeHTML}
            </div>
            <div class="pwr10-row-input-label"><div>${esc(r.label)}</div></div>
          </div>
        </div>
      `.trim();

      grid.appendChild(wrap.firstElementChild);
    });
  } catch (err) {
    if (DEBUG) console.warn('[pwr10 S1]', err);
  }
}


//===================
// Section 2 (Group 2 + two distinct bars per row, below each row)
//===================
export function paintSection2(mainRow, sdfRow) {
  // Head + subtitle
  const headerEl = document.querySelector('[data-var="section2-header"]');
  if (headerEl) headerEl.textContent = 'Performance Essentials';
  const subtitleEl = document.querySelector('[data-var="section2-subtitle"]');
  if (subtitleEl) {
    subtitleEl.textContent =
      `Protein, fat, and calories for ${mainRow['data-brand']} ${mainRow['data-one']} vs. Sport Dog Food ${sdfRow['data-one']}`;
  }

  // Parse numeric values (do this BEFORE checking for classic DOM)
  const vals = (row) => ({
    protein: Number(row['ga_crude_protein_%']) || 0,
    fat:     Number(row['ga_crude_fat_%'])     || 0,
    kcals_c: Number(row['ga_kcals_per_cup'])   || 0,
    kcals_k: Number(row['ga_kcals_per_kg'])    || 0,
  });

  const b = vals(mainRow); // competitor
  const s = vals(sdfRow);  // sport

  // Classic bar rows are OPTIONAL; only paint if the node exists
  const classicRoot = document.querySelector('#section-2 .cmp2-rows');
  if (classicRoot) {
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
            <div class="cmp2-values"><span class="cmp2-badge brand">${esc(fmt(bv))}</span></div>
          </div>

          <div class="cmp2-bar sport" aria-label="Sport Dog Food ${esc(label)}">
            <div class="cmp2-track"><div class="cmp2-fill sport" style="width:${pct(sv, maxKey)}%"></div></div>
            <div class="cmp2-values"><span class="cmp2-badge sport">${esc(fmt(sv))}</span></div>
          </div>
        </div>
      `;
    };

    classicRoot.innerHTML = [
      row('protein', 'Crude Protein', '%'),
      row('fat',     'Crude Fat',     '%'),
      row('kcals_c', 'Kcals / Cup'),
      row('kcals_k', 'Kcals / Kg'),
    ].join('');
  }

  // Optional summary text (independent of classic root)
  const madlibEl = document.querySelector('[data-var="section2-madlib"]');
  if (madlibEl) {
    madlibEl.textContent =
      `${mainRow['data-brand']} ${mainRow['data-one']}: ${b.protein}% protein, ${b.fat}% fat, ${b.kcals_c} kcals/cup. ` +
      `Sport Dog Food ${sdfRow['data-one']}: ${s.protein}% protein, ${s.fat}% fat, ${s.kcals_c} kcals/cup.`;
  }


// ──────────────────────────────────────────────
// PWR10 mirror (Section 2) — values + match + delta + evaluation indicator
// ──────────────────────────────────────────────

try {
  // target ONLY the Section-2 grid
const grid =
  document.querySelector('#pwr10-section2-grid') ||
  document.querySelector('#pwr10-section2 .pwr10-rows-grid.section2') ||
  document.querySelector('#pwr10-section2') ||
  document.querySelector('.pwr10-rows-grid.section2');
  if (!grid) return;

  const compShort  = `${(mainRow['data-brand'] || 'Competitor')} ${mainRow['data-one'] || ''}`.trim();
  const sportShort = `Sport Dog Food ${sdfRow['data-one'] || ''}`.trim();

  // ✅ add a metric key for the per-metric class on the icon
  const data = [
    { label:'Crude Protein', metric:'protein',  aVal:b.protein, cVal:s.protein, brandA:compShort, brandC:sportShort },
    { label:'Crude Fat',     metric:'fat',      aVal:b.fat,     cVal:s.fat,     brandA:compShort, brandC:sportShort },
    { label:'Kcals / Cup',   metric:'kcalscup', aVal:b.kcals_c, cVal:s.kcals_c, brandA:compShort, brandC:sportShort },
    { label:'Kcals / Kg',    metric:'kcalskg',  aVal:b.kcals_k, cVal:s.kcals_k, brandA:compShort, brandC:sportShort },
  ];

  // clear prior S2 rows
  grid.querySelectorAll('.pwr10-row-grid.section2').forEach(n => n.remove());

  // gauge + evaluation helpers
  const GAUGE_SRC    = `${CDN}/689c865c7c9020f40949a410_gauge-stick.png`;
  const CHECK_ICON   = `${CDN}/618aa6ac2614d4537c3b83d9_ui-snippet-icon-check.svg`;
  const EXCLAIM_ICON = `${CDN}/689c91a3cc958318e962d0ce_exclamation-solid-full.svg`;

  const gaugeDeg = (label, v) => {
    const n = Number(v) || 0;
    if (/protein|fat/i.test(label)) return n;      // 15 -> 15deg
    if (/cup/i.test(label))          return n/10;  // 465 -> 46.5deg
    if (/kg/i.test(label))           return n/100; // 4750 -> 47.5deg
    return n;
  };

  const evalMetric = (label, v) => {
    const n = Number(v) || 0;
    if (/protein/i.test(label)) return n > 25;
    if (/fat/i.test(label))     return n > 14;
    if (/cup/i.test(label))     return n > 420;
    if (/kg/i.test(label))      return n > 3400;
    return false;
  };

  const indicatorHTML = (pass) => (
    pass
      ? `<div class="cmp-indicator check"><img alt="" src="${CHECK_ICON}" class="indicator-check"></div>`
      : `<div class="cmp-indicator exclaim"><img alt="" src="${EXCLAIM_ICON}"></div>`
  );

  const html = data.map(({ label, metric, aVal, cVal, brandA, brandC }) => {
    const numA = Number(aVal), numC = Number(cVal);
    const { comp: compDelta, sport: sportDelta } = pwr10DeltaBadgePair(numA, numC);

    const format = /protein|fat/i.test(label)
      ? (v) => `${v}%`
      : (v) => `${v}`;

    // rotations
    const aDeg = gaugeDeg(label, numA);
    const cDeg = gaugeDeg(label, numC);

    // evaluations -> produce `check` or `exclaim`
    const aPass = evalMetric(label, numA);
    const cPass = evalMetric(label, numC);
    const aIconCls = aPass ? 'check' : 'exclaim';
    const cIconCls = cPass ? 'check' : 'exclaim';
    const aBgCls   = aPass ? 'eval-ok' : 'eval-attn';
    const cBgCls   = cPass ? 'eval-ok' : 'eval-attn';

    return `
      <div class="w-layout-grid pwr10-row-grid section2">
        <div class="pwr10-row-label"><div class="pwr10-row-label2"><div>${esc(label)}</div></div></div>
        <div class="pwr10-vertical-divider"></div>

        <!-- Competitor -->
        <div class="pwr10-row-value">
          <div class="pwr10-row-mobile-name"><div>${esc(brandA)}</div></div>
          <div class="pwr10-row-input ${aBgCls}">
            <!-- ✅ add metric class on icon: e.g., 'pwr10-icon check protein' -->
            <div class="pwr10-icon ${aIconCls} ${metric}">
              <img src="${GAUGE_SRC}" loading="lazy" alt="" class="rotate-gauge"
                   width="auto" height="60"
                   style="transform:rotate(${aDeg}deg)" aria-hidden="true">
              ${indicatorHTML(aPass)}
            </div>
            <div class="pwr10-title section2"><div>${esc(format(numA))}</div></div>
            ${pwr10CmpMatchBadge(numA, numC)}
            ${compDelta}
          </div>
          <div class="pwr10-row-input-label"><div>${esc(label)}</div></div>
        </div>

        <div class="pwr10-vertical-divider mobile"></div>

        <!-- Sport -->
        <div class="pwr10-row-value">
          <div class="pwr10-row-mobile-name"><div>${esc(brandC)}</div></div>
          <div class="pwr10-row-input ${cBgCls}">
            <!-- ✅ add metric class on icon: e.g., 'pwr10-icon exclaim kcalskg' -->
            <div class="pwr10-icon ${cIconCls} ${metric}">
              <img src="${GAUGE_SRC}" loading="lazy" alt="" class="rotate-gauge"
                   width="auto" height="60"
                   style="transform:rotate(${cDeg}deg)" aria-hidden="true">
              ${indicatorHTML(cPass)}
            </div>
            <div class="pwr10-title section2"><div>${esc(format(numC))}</div></div>
            ${pwr10CmpMatchBadge(numC, numA)}
            ${sportDelta}
          </div>
          <div class="pwr10-row-input-label"><div>${esc(label)}</div></div>
        </div>
      </div>
    `;
  }).join('');

  const frag = document.createDocumentFragment();
  const temp = document.createElement('div');
  temp.innerHTML = html;
  Array.from(temp.children).forEach(node => frag.appendChild(node));
  grid.appendChild(frag);
} catch (err) {
  console.error('[pwr10 S2]', err);
}
}


// ===========================
// Section 3 (ingredients overlay + inline search above lists)
// ===========================
export function paintSection3(mainRow, sdfRow) {
  // headers
  const h = document.querySelector('[data-var="section3-header"]');
  if (h) h.textContent = 'Under the Hood';
  const p = document.querySelector('[data-var="section3-subtitle"]');
  if (p) p.textContent = "Let's dig in and see how each ingredient stacks up.";

  const sec3 = document.querySelector('#section-3');
  if (!sec3) return;

  // Ensure DOM scaffold exists (search bar ABOVE lists)
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
// Optional Section 3 madlib (ingredient totals & categories)
{
  const brand     = (mainRow['data-brand'] || 'Competitor').trim();
  const brandName = (mainRow['data-one']    || '').trim();
  const sdfName   = (sdfRow['data-one']     || '').trim();

  const s3Madlib =
    `${brand} ${brandName} lists ${countsB.total} ingredients ` +
    `(${countsB.Protein} protein, ${countsB.Plants} plants, ${countsB.Supplemental} supplemental). ` +
    `Sport Dog Food ${sdfName} lists ${countsS.total} ` +
    `(${countsS.Protein} protein, ${countsS.Plants} plants, ${countsS.Supplemental} supplemental).`;

  setVarText('section3-madlib', s3Madlib);
}

  const overlayRow = (key, label) => {
    const b = countsB[key] ?? 0;
    const s = countsS[key] ?? 0;

    const { comp: brandDelta, sport: sdfDelta } = pwr10DeltaBadgePair(b, s);
    const classKey = String(key).toLowerCase(); // total | protein | plants | supplemental | other
    const isFirst = classKey === 'total';
    const rowClass = ['cmp3-row', classKey, isFirst ? 'first' : ''].filter(Boolean).join(' ');

    const name1 = (mainRow['data-one'] || '').trim();
    const name2 = (sdfRow['data-one']  || '').trim();

    return /* html */ `
      <div class="${rowClass}" data-key="${esc(classKey)}">
        <div class="cmp3-title">
          <div class="cmp3-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 9h16"></path>
              <path d="M4 15h16"></path>
              <path d="M10 3v18"></path>
              <path d="M14 3v18"></path>
            </svg>
          </div>
          <div class="cmp3-label"><div>${esc(label)}</div></div>
        </div>

        <div class="cmp3-entry1">
          <div class="cmp3-name1"><div>${esc(name1)}</div></div>
          <div class="cmp3-badge brand"><div>${esc(String(b))}</div></div>
          <div class="cmp3-diff1">${brandDelta}</div>
        </div>

        <div class="cmp3-entry3">
          <div class="cmp3-name2"><div>${esc(name2)}</div></div>
          <div class="cmp3-badge sdf"><div>${esc(String(s))}</div></div>
          <div class="cmp3-diff2">${sdfDelta}</div>
        </div>
      </div>
    `;
  };

  rowsRoot.classList.add('cmp3-rows');
  rowsRoot.innerHTML = [
    overlayRow('total',        'Evaluated'),
    overlayRow('Protein',      'Protein'),
    overlayRow('Plants',       'Plants'),
    overlayRow('Supplemental', 'Supplemental'),
    (countsB.Other || countsS.Other) ? overlayRow('Other', 'Other') : ''
  ].join('');

  // Names
  brandNameEl.textContent = mainRow['data-brand']
    ? `${mainRow['data-brand']} ${mainRow['data-one'] || ''}`.trim()
    : `${mainRow['data-one'] || ''}`;
  sportNameEl.textContent = `Sport Dog Food ${sdfRow['data-one'] || ''}`.trim();

  // Lists (inline pills with hidden keys already present)
  brandListEl.innerHTML = renderIngListDivs(mainRow);
  sportListEl.innerHTML = renderIngListDivs(sdfRow);



  // Wire simple search to filter both lists
  setupIngredientSearch(sec3);
initCmp3Carousel(sec3);
}


// ===========================
// Section 3 DOM scaffold (search ABOVE lists + suggestions area)
// ===========================
function ensureSection3Dom(sec3) {
  const ok =
    sec3.querySelector('.cmp3') &&
    sec3.querySelector('.cmp3-rows-wrap') &&
    sec3.querySelector('#cmp3-rows') &&
    sec3.querySelector('.cmp3-prev') &&
    sec3.querySelector('.cmp3-next') &&
    sec3.querySelector('#cmp3-lists') &&
    sec3.querySelector('#cmp3-brand-list') &&
    sec3.querySelector('#cmp3-sport-list') &&
    sec3.querySelector('[data-var="brand-1-sec3-inglist"]') &&
    sec3.querySelector('[data-var="sport-1-sec3-inglist"]') &&
    sec3.querySelector('#cmp3-searchbar') &&
    sec3.querySelector('#pwrf-search-input') &&
    sec3.querySelector('#pwrf-clear-btn') &&
    sec3.querySelector('#cmp3-suggest');

  if (ok) return;

  sec3.innerHTML = `
    <div class="cmp3">
      <!-- Card strip with arrows ABOVE actions/search -->
      <div class="cmp3-rows-wrap">
        <button class="cmp3-arrow cmp3-prev" aria-label="Scroll left" type="button">‹</button>
        <div class="cmp3-rows" id="cmp3-rows"></div>
        <button class="cmp3-arrow cmp3-next" aria-label="Scroll right" type="button">›</button>
      </div>

      <!-- Actions/search BELOW the cards -->
      <div class="cmp3-actions">
        <div class="pwrf_toolbar" id="cmp3-searchbar">
          <div class="pwrf_searchbar" role="search">
            <input type="text" id="pwrf-search-input" class="pwrf_search-input"
                   placeholder="Search ingredients…" aria-label="Search ingredients" />
            <button id="pwrf-clear-btn" class="pwrf_clear-btn" type="button" aria-label="Clear" hidden>×</button>
          </div>
          <div class="cmp3-suggest" id="cmp3-suggest" aria-live="polite"></div>
        </div>
      </div>

      <!-- Two lists -->
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
// Section 3 carousel init
// ===========================
function initCmp3Carousel(sec3) {
  const scroller = sec3?.querySelector('#cmp3-rows');
  const prev     = sec3?.querySelector('.cmp3-prev');
  const next     = sec3?.querySelector('.cmp3-next');
  if (!scroller || !prev || !next) return;

  // Avoid duplicate listeners if paintSection3 runs more than once
  if (scroller._carouselWired) return;
  scroller._carouselWired = true;

  // Derive card width + gap from computed styles
  const getGap = () => {
    const s = window.getComputedStyle(scroller);
    const g = parseFloat(s.columnGap || s.gap || '12');
    return Number.isFinite(g) ? g : 12;
  };

  const oneCardWidth = () => {
    const el  = scroller.querySelector('.cmp3-row');
    const gap = getGap();
    const w   = el ? el.getBoundingClientRect().width : scroller.clientWidth * 0.9;
    return Math.ceil(w + gap);
  };

  const scrollByCard = (dir) =>
    scroller.scrollBy({ left: dir * oneCardWidth(), behavior: 'smooth' });

  // Click arrows
  const onPrev = () => scrollByCard(-1);
  const onNext = () => scrollByCard(+1);
  prev.addEventListener('click', onPrev);
  next.addEventListener('click', onNext);

  // Drag / swipe
  let isDown = false, startX = 0, startScroll = 0;

  const onDown = (e) => {
    isDown = true;
    startX = (e.touches ? e.touches[0].pageX : e.pageX) || 0;
    startScroll = scroller.scrollLeft;
    scroller.classList.add('dragging'); // style .dragging { user-select:none; cursor:grabbing; }
  };

  const onMove = (e) => {
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].pageX : e.pageX) || 0;
    scroller.scrollLeft = startScroll - (x - startX);
    if (e.cancelable) e.preventDefault(); // only when allowed
  };

  const onUp = () => {
    isDown = false;
    scroller.classList.remove('dragging');
  };

  scroller.addEventListener('mousedown',  onDown);
  scroller.addEventListener('touchstart', onDown, { passive: true });
  document.addEventListener('mousemove',  onMove);                 // mousemove must not be passive
  document.addEventListener('touchmove',  onMove, { passive: false }); // we call preventDefault
  document.addEventListener('mouseup',    onUp);
  document.addEventListener('touchend',   onUp);
  document.addEventListener('touchcancel',onUp);

  // Wheel / trackpad horizontal scroll
  const onWheel = (e) => {
    // Only act on horizontal intent; let vertical scrolling pass through
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    scroller.scrollLeft += e.deltaX;
  };
  scroller.addEventListener('wheel', onWheel, { passive: true });

  // Keyboard support
  scroller.setAttribute('tabindex', '0');
  scroller.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { scrollByCard(+1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { scrollByCard(-1); e.preventDefault(); }
    else if (e.key === 'Home') { scroller.scrollTo({ left: 0, behavior: 'smooth' }); e.preventDefault(); }
    else if (e.key === 'End') { scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' }); e.preventDefault(); }
  });

  // Optional: expose a cleanup if you ever need to re-init manually
  scroller._carouselDestroy = () => {
    prev.removeEventListener('click', onPrev);
    next.removeEventListener('click', onNext);
    scroller.removeEventListener('mousedown', onDown);
    scroller.removeEventListener('touchstart', onDown, { passive: true });
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove, { passive: false });
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchend', onUp);
    document.removeEventListener('touchcancel', onUp);
    scroller.removeEventListener('wheel', onWheel);
    scroller._carouselWired = false;
  };
}


// ===========================
// Suggestions index (Fuse or fallback)
// ===========================
function makeSuggestionIndex(sec3) {
  const brandBox = sec3.querySelector('#cmp3-brand-list .ci-ings-list');
  const sportBox = sec3.querySelector('#cmp3-sport-list .ci-ings-list');

  const tokens = new Set();

  const eat = (wrap) => {
    // visible label
    const label = (wrap.querySelector('.ci-ing-displayas')?.textContent || '').trim().toLowerCase();
    if (label) tokens.add(label);

    // data-search tokens
    const raw = (wrap.getAttribute('data-search') || '').toLowerCase();
    raw.split(/\s+/).forEach(t => {
      if (!t) return;
      if (t.length < 2) return; // drop 1-char noise
      tokens.add(t);
    });
  };

  [brandBox, sportBox].forEach(box => {
    if (!box) return;
    box.querySelectorAll('.ci-ing-wrapper').forEach(eat);
  });

  const list = Array.from(tokens);

  let fuse = null;
  if (window.Fuse) {
    fuse = new window.Fuse(list, {
      includeScore: true,
      threshold: 0.3,            // fairly strict (encourages correct spelling)
      minMatchCharLength: 2,
      ignoreLocation: true,
      useExtendedSearch: false
    });
  }

  return { fuse, list };
}


// ===========================
// Render suggestion pills under the search bar
// ===========================
function renderSuggestPills({ box, items, onPick }) {
  if (!box) return;
  if (!items || !items.length) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }
  const html = items.slice(0, 8).map(s =>
    `<button type="button" class="cmp3-suggest-pill" data-val="${s.replace(/"/g,'&quot;')}">${s}</button>`
  ).join('');
  box.innerHTML = html;
  box.style.display = '';

  // wire clicks
  box.querySelectorAll('.cmp3-suggest-pill').forEach(btn => {
    btn.onclick = (e) => onPick(String(btn.getAttribute('data-val') || '').trim());
  });
}


// ===========================
// Inline ingredient search + suggestions (filters both lists)
// ===========================
function setupIngredientSearch(sec3) {
  const input     = sec3.querySelector('#pwrf-search-input');
  const clearBtn  = sec3.querySelector('#pwrf-clear-btn');
  const suggestEl = sec3.querySelector('#cmp3-suggest');
  const bar       = sec3.querySelector('.pwrf_searchbar');

  if (!input || !clearBtn) return;

  // Always grab FRESH list nodes (lists are re-rendered on each paint)
  const getBrandBox = () => sec3.querySelector('#cmp3-brand-list .ci-ings-list');
  const getSportBox = () => sec3.querySelector('#cmp3-sport-list .ci-ings-list');

  // ──────────────────────────────────────────────
  // SEE MORE (per list) — single definitions
  // ──────────────────────────────────────────────
  function collapseLimit() {
    return window.matchMedia('(max-width: 600px)').matches ? 8 : 12;
  }

  // Return items that MATCH the query (even if collapsed)
  function matchedItems(listRoot) {
    return Array.from(listRoot.querySelectorAll('.ci-ing-wrapper'))
      .filter(el => el.dataset.smMatch === '1');
  }

  function initSeeMoreForList(listRoot) {
    if (!listRoot || listRoot._seeMoreWired) return;
    listRoot._seeMoreWired = true;

    let wrap = listRoot.querySelector('.ci-see-more-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'ci-see-more-wrap';
      wrap.innerHTML = `
        <div class="ci-fade" aria-hidden="true"></div>
        <button type="button" class="ci-see-more-btn" aria-expanded="false">Show more</button>
      `;
      listRoot.appendChild(wrap);
    }

    const btn = wrap.querySelector('.ci-see-more-btn');
    btn.addEventListener('click', () => {
      const expanded = listRoot.dataset.expanded === 'true';
      listRoot.dataset.expanded = String(!expanded);
      applySeeMore(listRoot);
    });

    applySeeMore(listRoot);
  }

  function applySeeMore(listRoot) {
    const limit    = collapseLimit();
    const matches  = matchedItems(listRoot);
    const expanded = listRoot.dataset.expanded === 'true';
    const wrap = listRoot.querySelector('.ci-see-more-wrap');
    const btn  = wrap?.querySelector('.ci-see-more-btn');
    const fade = wrap?.querySelector('.ci-fade');

    if (!matches.length || matches.length <= limit) {
      matches.forEach(el => { el.style.display = ''; el.hidden = false; });
      if (wrap) wrap.style.display = 'none';
      if (btn)  btn.setAttribute('aria-expanded', 'false');
      listRoot.dataset.expanded = 'false';
      return;
    }

    if (!expanded) {
      matches.forEach((el, i) => {
        const show = i < limit;
        el.style.display = show ? '' : 'none';
        el.hidden = !show;
      });
      if (wrap) wrap.style.display = '';
      if (btn) { btn.textContent = `Show all ${matches.length}`; btn.setAttribute('aria-expanded', 'false'); }
      if (fade) fade.style.display = '';
    } else {
      matches.forEach(el => { el.style.display = ''; el.hidden = false; });
      if (wrap) wrap.style.display = '';
      if (btn) { btn.textContent = 'Show less'; btn.setAttribute('aria-expanded', 'true'); }
      if (fade) fade.style.display = 'none';
    }
  }

  // Re-apply per list (brand + sport) whenever things change
  function refreshSeeMore() {
    const brandListRoot = sec3.querySelector('#cmp3-brand-list .ci-ings-list');
    const sportListRoot = sec3.querySelector('#cmp3-sport-list .ci-ings-list');
    if (brandListRoot) { initSeeMoreForList(brandListRoot); applySeeMore(brandListRoot); }
    if (sportListRoot) { initSeeMoreForList(sportListRoot); applySeeMore(sportListRoot); }
  }

  // Re-apply limits on resize (e.g., crossing 600px)
  if (!window._cmp3SeeMoreResize) {
    let _smResizeId;
    window.addEventListener('resize', () => {
      if (_smResizeId) cancelAnimationFrame(_smResizeId);
      _smResizeId = requestAnimationFrame(refreshSeeMore);
    });
    window._cmp3SeeMoreResize = true;
  }

  // ensure empty cards exist (brand + sport) with a "Clear" link
  const ensureEmpty = (rootSel, cls, html) => {
    const root = sec3.querySelector(rootSel);
    if (!root) return null;
    let el = root.querySelector(`.${cls}`);
    if (!el) {
      el = document.createElement('div');
      el.className = cls;
      el.hidden = true;
      el.style.display = 'none';
      el.innerHTML = html || 'No results.';
      root.appendChild(el);
    }
    return el;
  };

  const brandEmpty = ensureEmpty('#cmp3-brand-list','ci-no-results',
    'No ingredients matched your search. <a class="ci-clear" href="#" data-act="clear">Clear</a>'
  );
  const sportEmpty = ensureEmpty('#cmp3-sport-list','ci-no-results',
    'No ingredients matched your search. <a class="ci-clear" href="#" data-act="clear">Clear</a>'
  );
  const sportContEmpty = ensureEmpty('#cmp3-sport-list','ci-no-results-contentious',
    'Sport Dog Food avoids most contentious ingredients. <a class="ci-clear" href="#" data-act="clear">Clear</a>'
  );

  // Delegated handler for the inline "Clear" links
  sec3.addEventListener('click', (e) => {
    const a = e.target.closest('.ci-clear');
    if (!a) return;
    e.preventDefault();
    input.value = '';
    doFilter();
    input.focus();
  });

  // Suggestions (Fuse or fallback)
  let { fuse, list } = makeSuggestionIndex(sec3);

  const suggestFor = (lastTerm, existingTerms) => {
    if (!lastTerm || lastTerm.length < 2) return [];
    let candidates = [];
    if (window.Fuse && fuse) {
      candidates = fuse.search(lastTerm).map(r => r.item);
    } else {
      const lt = lastTerm.toLowerCase();
      candidates = list.filter(s => s.startsWith(lt) || s.includes(lt));
    }
    const taken = new Set(existingTerms);
    return candidates.filter(s => !taken.has(s)).slice(0, 8);
  };

  const renderSuggest = (lastTerm, existingTerms = []) => {
    const items = suggestFor(lastTerm, existingTerms);
    renderSuggestPills({ box: suggestEl, items, onPick: applySuggestion });
  };

  const applySuggestion = (s) => {
    const raw = input.value;
    const endsWithSpace = /\s$/.test(raw);
    let parts = raw.trim().split(/\s+/).filter(Boolean);
    if (!endsWithSpace && parts.length) parts.pop();
    parts.push(s);
    input.value = parts.join(' ') + ' ';
    doFilter();
    renderSuggest('');
    input.focus();
  };

  // Filtering helpers
  const cacheTokens = (wrap) => {
    if (!wrap._tokenSet) {
      const str = (wrap.getAttribute('data-search') || '').toLowerCase();
      wrap._tokenSet = new Set(str.split(/\s+/).filter(Boolean));
    }
    return wrap._tokenSet;
  };

  const filterList = (listEl, terms) => {
    const items = listEl.querySelectorAll('.ci-ing-wrapper');
    let shown = 0;
    items.forEach(it => {
      const set = cacheTokens(it);
      const ok = terms.length === 0 ? true : terms.every(t => set.has(t));

      // mark current match state for see-more to use later
      if (ok) it.dataset.smMatch = '1'; else delete it.dataset.smMatch;

      // normal visibility for filter
      it.hidden = !ok;
      it.style.display = ok ? '' : 'none';

      if (ok) shown++;
    });
    return shown;
  };

  const toggle = (el, show) => {
    if (!el) return;
    el.hidden = !show;
   el.style.display = show ? 'block' : 'none';
  };

  // Hoisted declaration avoids init-order issues
  function doFilter() {
    const brandBox = getBrandBox();
    const sportBox = getSportBox();
    if (!brandBox || !sportBox) return;

    const raw   = (input.value || '').toLowerCase();
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    const lastIsPartial = !/\s$/.test(input.value) && parts.length ? parts[parts.length - 1] : '';
    const terms = lastIsPartial ? parts.slice(0, -1) : parts;

    const brandShown = filterList(brandBox, terms);
    const sportShown = filterList(sportBox, terms);

    // Brand "no results"
    toggle(brandEmpty, terms.length > 0 && brandShown === 0);

    // —— Dynamic contentious logic (based on visible flags on brand side) ——
    const contentiousInBrand = Array.from(
      brandBox.querySelectorAll('.ci-ing-wrapper')
    ).filter(it => !it.hidden && /\bcontentious\b/.test(String(it.getAttribute('data-flags') || '')));

    const firstContentiousName =
      contentiousInBrand[0]?.querySelector('.ci-ing-displayas')?.textContent?.trim() || '';

    const showContMsg = (terms.length > 0 && sportShown === 0 && contentiousInBrand.length > 0);

    if (sportContEmpty && showContMsg) {
      sportContEmpty.innerHTML =
        `Sport Dog Food avoids most contentious ingredients. <strong>${esc(firstContentiousName)}</strong> is an ingredient that you won't find in any of our formulas. ` +
        `<a class="ci-clear" href="#" data-act="clear">Clear</a>`;
    }

    // Toggle Sport empties
    toggle(sportContEmpty, showContMsg);
    toggle(sportEmpty, terms.length > 0 && sportShown === 0 && !showContMsg);

    // Suggestions for trailing partial
    const existing = new Set(terms);
    renderSuggest(lastIsPartial, Array.from(existing));

    // Blank query => show all, hide empties + suggestions
    if (parts.length === 0) {
      toggle(brandEmpty, false);
      toggle(sportEmpty, false);
      toggle(sportContEmpty, false);
      renderSuggest('');
    }

    // Re-apply collapses to whatever is currently matched
    refreshSeeMore();
  }

  // helper so we can call the same steps on first paint and after switches
  const applyFilterAndCollapse = () => {
    if (typeof input._reindex === 'function') input._reindex(); // rebuild suggestion index
    doFilter();       // re-filter brand/sport lists based on current input value
    refreshSeeMore(); // re-apply per-list collapse
  };

  // First-time wiring only (listeners, focus styles, etc.)
  if (!input._wired) {
    input._wired = true;

    // Make the clear button available
    clearBtn.hidden = false;
    clearBtn.style.display = '';

    if (bar && !bar._focusWired) {
      bar._focusWired = true;
      input.addEventListener('focus', () => bar.classList.add('is-focused'));
      input.addEventListener('blur',  () => bar.classList.remove('is-focused'));
    }

    // Bind filter on input
    input.addEventListener('input', doFilter, { passive: true });

    // Clear button
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      input.value = '';
      doFilter();
      input.focus();
    });

    // ESC clears
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        input.value = '';
        doFilter();
        e.preventDefault();
      }
    });

    // Reindex hook used by applyFilterAndCollapse
    input._reindex = () => { ({ fuse, list } = makeSuggestionIndex(sec3)); };

    // Observe the lists container; when Section 3 re-renders on switch,
    // re-apply filter + collapse to the fresh nodes
    const listsRoot = sec3.querySelector('#cmp3-lists');
    if (listsRoot && !input._listsObserver) {
      const mo = new MutationObserver(() => {
        requestAnimationFrame(applyFilterAndCollapse);
      });
      mo.observe(listsRoot, { childList: true, subtree: true });
      input._listsObserver = mo;
    }

    // Initial render
    applyFilterAndCollapse();
  } else {
    // already wired (e.g., after a formula switch): just re-apply to new content
    if (typeof input._reindex === 'function') input._reindex();
    applyFilterAndCollapse();
  }
}


// ===========================
// Render inline ingredient list tags + searchable hidden keys (deduped)
// ===========================
function renderIngListDivs(row) {
  const ids   = Array.isArray(row['ing-data-fives']) ? row['ing-data-fives'] : [];
  const pairs = ids.map(id => ({ id, ing: ING_MAP[id] })).filter(p => p.ing);

  return `
    <div class="ci-ings-list">
      ${pairs.map(({ id, ing }) => {
        const display      = esc(ing.displayAs || ing.Name || '');
        const consumerTag  = getConsumerTypeTag(ing['data-type']); // Protein | Plants | Supplemental | Other
        const consumerSlug = (consumerTag || 'Other').toLowerCase();
        const contentiousExplain = ing['cont-cf-explain-contentious'] || '';
        const termDescription    = ing.termDescription || '';

        const tags = [];
        if (ing['data-type']) {
          tags.push(`<div class="ci-ing-tag ci-tag-default ci-tag-${esc(consumerSlug)}">${esc(consumerTag)}</div>`);
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

  // Build the searchable corpus (EXCLUDES contentiousExplain & termDescription)
const raw = [
  ing.Name, ing.displayAs, ing.groupWith,
  ing['data-type'] || '', ing.recordType || '',
  ing.animalType || '',   ing.animalAssist || '',
  ing.plantType || '',    ing.plantAssist || '',
  ing.supplementalType || '', ing.supplementalAssist || '',
  ...(ing.tags || [])
].join(' ').toLowerCase();

const searchKeys = Array.from(new Set(raw.split(/\s+/).filter(Boolean))).join(' ');

// Flags unchanged
const flags = [
  consumerSlug,
  ing.tagPoultry     ? 'poultry'     : '',
  ing.tagAllergy     ? 'allergy'     : '',
  ing.tagContentious ? 'contentious' : ''
].filter(Boolean).join(' ');
 return `
  <div
    class="ci-ing-wrapper"
    data-search="${esc(searchKeys)}"
    data-ing-id="${esc(id)}"
    data-consumer="${esc(consumerSlug)}"
    data-flags="${esc(flags)}"
    data-explain-contentious="${esc(contentiousExplain)}"
    data-term-description="${esc(termDescription)}"
  >
    <div class="ci-ing-displayas">${display}</div>
    <div class="ci-ing-tag-wrapper hide-scrollbar">${tags.join('')}</div>

    <!-- NEW hidden meta for UI/overlays/tooltips -->
    <div class="ci-ing-meta" hidden aria-hidden="true">
      <div class="ci-ing-explain-contentious">${esc(contentiousExplain)}</div>
      <div class="ci-ing-term-description">${esc(termDescription)}</div>
    </div>

    <span class="ci-ing-keys" hidden aria-hidden="true">${esc(searchKeys)}</span>
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
  // NEW: ensure PWR10 header row uses the correct HTML
  paintPwr10HeaderRow(mainRow, sdfRow);
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

// before: initCompareScaffold();
initCompareScaffoldV2();
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
