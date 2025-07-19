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

function paintSection1(mainRow, sdfRow) {
  // — Render the "this-mark" with Typed.js if present —
  const thisMarkValue = mainRow["this-mark"];
  if (thisMarkValue && window.Typed) {
    const thisMarkEl = document.querySelector('[data-var="brand-1-thismark"]');
    if (thisMarkEl) {
      thisMarkEl.setAttribute('data-text', thisMarkValue);
      thisMarkEl.textContent = '';
      thisMarkEl.removeAttribute('data-typed');
      new Typed(thisMarkEl, {
        strings: [thisMarkValue],
        typeSpeed: 24,
        showCursor: false
      });
    }
  }

  // — Header & subtitle —
  const headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Nutrition Profile";

  const subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) {
    subtitleEl.textContent =
      `Comparing ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;
  }

  // — Phrase helpers —
  function getGrainPhrase(row) {
    const g = (row["data-diet"] || row["data-grain"] || "").toLowerCase();
    if (g.includes("free")) return "grain-free";
    if (g.includes("grain")) return "grain-inclusive";
    return "grain-inclusive";
  }
  function getMeatPhrase(row) {
    const f = (row["specs_primary_flavor"] || "").toLowerCase();
    return ["chicken","beef","fish","meat"].some(w => f.includes(w))
      ? "meat-based"
      : "animal-based";
  }

  // — Build the two-sentence madlib —
  const mainBrand    = mainRow["data-brand"]   || "Brand";
  const mainName     = mainRow["data-one"]     || "Product";
  const sdfName      = sdfRow["data-one"]      || "Sport Dog Food";
  const mainSpec     = buildLegumePoultryPhrase(mainRow);
  const sdfSpec      = buildLegumePoultryPhrase(sdfRow);

  const mainSentence = 
    `${mainBrand} ${mainName} is a ${getGrainPhrase(mainRow)}, ${getMeatPhrase(mainRow)} formula that’s ${mainSpec}.`;
  const sdfSentence  =
    `${sdfName} is a ${getGrainPhrase(sdfRow)}, ${getMeatPhrase(sdfRow)} diet that’s ` +
    `<span class="highlight">${sdfSpec}</span>.`;

  const madlib = `${mainSentence} ${sdfSentence}`;

  const madlibEl = document.querySelector('[data-var="section1-madlib"]');
  if (madlibEl) {
    madlibEl.setAttribute('data-text', madlib);
    madlibEl.textContent = '';
    madlibEl.removeAttribute('data-typed');
  }

  // — Rest of DOM wiring —
  let el;
  el = document.querySelector('[data-var="brand-1-name"]');
  if (el) el.textContent = mainName;

  el = document.querySelector('[data-var="brand-1-brand"]');
  if (el) el.textContent = mainBrand;

  el = document.querySelector('[data-var="brand-1-flavor"]');
  if (el) el.textContent = mainRow["specs_primary_flavor"] || "";

  el = document.querySelector('[data-var="brand-1-diet"]');
  if (el) el.textContent = mainRow["data-diet"] || mainRow["data-grain"] || "";

  // lazy-load brand preview
  el = document.querySelector('[data-var="brand-1-previewimg"]');
  setLazyBackground(el, mainRow.previewengine);

  paintSvgIcon(
    '[data-var="brand-1-legumesfree"]',
    mainRow["data-legumes"]?.toLowerCase().includes("free")
  );
  paintSvgIcon(
    '[data-var="brand-1-poultryfree"]',
    mainRow["data-poultry"]?.toLowerCase().includes("free")
  );

  el = document.querySelector('[data-var="sport-1-name"]');
  if (el) el.textContent = sdfName;

  el = document.querySelector('[data-var="sport-1-brand"]');
  if (el) el.textContent = "Sport Dog Food";

  el = document.querySelector('[data-var="sport-1-flavor"]');
  if (el) el.textContent = sdfRow["specs_primary_flavor"] || "";

  el = document.querySelector('[data-var="sport-1-diet"]');
  if (el) el.textContent = sdfRow["data-diet"] || sdfRow["data-grain"] || "";

  // lazy-load sport preview
  el = document.querySelector('[data-var="sport-1-previewimg"]');
  setLazyBackground(el, sdfRow.previewengine);

  paintSvgIcon(
    '[data-var="sport-1-legumesfree"]',
    sdfRow["data-legumes"]?.toLowerCase().includes("free")
  );
  paintSvgIcon(
    '[data-var="sport-1-poultryfree"]',
    sdfRow["data-poultry"]?.toLowerCase().includes("free")
  );
}

function paintSection2(mainRow, sdfRow) {
  // — Pull metrics into locals so they never end up undefined —
  const mainProtein = mainRow["ga_crude_protein_%"] || "?";
  const mainFat     = mainRow["ga_crude_fat_%"]     || "?";
  const mainKcal    = mainRow["ga_kcals_per_cup"]   || "?";
  const sdfProtein  = sdfRow["ga_crude_protein_%"]  || "?";
  const sdfFat      = sdfRow["ga_crude_fat_%"]      || "?";
  const sdfKcal     = sdfRow["ga_kcals_per_cup"]    || "?";
// Convert to numbers for comparison
const numMainProtein = parseFloat(mainProtein) || 0;
const numMainFat     = parseFloat(mainFat)     || 0;
const numMainKcal    = parseFloat(mainKcal)    || 0;
const numSdfProtein  = parseFloat(sdfProtein)  || 0;
const numSdfFat      = parseFloat(sdfFat)      || 0;
const numSdfKcal     = parseFloat(sdfKcal)     || 0;

// Calculate differences
const proteinDiff = numMainProtein - numSdfProtein;
const fatDiff     = numMainFat     - numSdfFat;
const kcalDiff    = numMainKcal    - numSdfKcal;

// Example usage (log or inject into DOM if needed)
console.log("Protein difference:", proteinDiff);
console.log("Fat difference:", fatDiff);
console.log("Kcal/cup difference:", kcalDiff);

  // — Header & subtitle —
  const headerEl = document.querySelector('[data-var="section2-header"]');
  if (headerEl) headerEl.textContent = "Performance Essentials";

  const subtitleEl = document.querySelector('[data-var="section2-subtitle"]');
  if (subtitleEl) subtitleEl.textContent =
    `Protein, fat, and calorie details for ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;

  // — Typed.js madlib —
  const madlibEl = document.querySelector('[data-var="section2-madlib"]');
  if (madlibEl) {
    const text =
      `${mainRow["data-brand"]} ${mainRow["data-one"]} provides ` +
      `${mainProtein}% protein, ${mainFat}% fat, and ${mainKcal} kcals/cup. ` +
      `Sport Dog Food ${sdfRow["data-one"]} provides ` +
      `${sdfProtein}% protein, ${sdfFat}% fat, and ${sdfKcal} kcals/cup for comparison.`;

    madlibEl.setAttribute('data-text', text);
    madlibEl.textContent = '';
    madlibEl.removeAttribute('data-typed');
  }

  // — Lazy-load preview images —
  let el = document.querySelector('[data-var="brand-1-sec2-previewimg"]');
  if (el) setLazyBackground(el, mainRow.previewengine);

  el = document.querySelector('[data-var="sport-1-sec2-previewimg"]');
  if (el) setLazyBackground(el, sdfRow.previewengine);

  // — Numeric specs for mainRow —
  el = document.querySelector('[data-var="brand-1-sec2-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";
  el = document.querySelector('[data-var="brand-1-protein"]');
  if (el) el.textContent = mainProtein + "%";
  el = document.querySelector('[data-var="brand-1-fat"]');
  if (el) el.textContent = mainFat + "%";
  el = document.querySelector('[data-var="brand-1-kcalscup"]');
  if (el) el.textContent = mainKcal;
  el = document.querySelector('[data-var="brand-1-kcalskg"]');
  if (el) el.textContent = mainRow["ga_kcals_per_kg"] || "";

  // — Numeric specs for sdfRow —
  el = document.querySelector('[data-var="sport-1-sec2-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";
  el = document.querySelector('[data-var="sport-1-protein"]');
  if (el) el.textContent = sdfProtein + "%";
  el = document.querySelector('[data-var="sport-1-fat"]');
  if (el) el.textContent = sdfFat + "%";
  el = document.querySelector('[data-var="sport-1-kcalscup"]');
  if (el) el.textContent = sdfKcal;
  el = document.querySelector('[data-var="sport-1-kcalskg"]');
  if (el) el.textContent = sdfRow["ga_kcals_per_kg"] || "";

// --Diffs -
// — Difference indicators —
// — Brand-1 differences —
document.querySelectorAll('[data-var="brand-1-protein-diff"]').forEach(el => {
  el.textContent = proteinDiff === 0 ? "–" : `${proteinDiff > 0 ? '+' : ''}${proteinDiff}%`;
});
document.querySelectorAll('[data-var="brand-1-fat-diff"]').forEach(el => {
  el.textContent = fatDiff === 0 ? "–" : `${fatDiff > 0 ? '+' : ''}${fatDiff}%`;
});
document.querySelectorAll('[data-var="brand-1-kcal-diff"]').forEach(el => {
  el.textContent = kcalDiff === 0 ? "–" : `${kcalDiff > 0 ? '+' : ''}${kcalDiff} kcals`;
});

// — Sport-1 differences (inverted logic) —
document.querySelectorAll('[data-var="sport-1-protein-diff"]').forEach(el => {
  const val = proteinDiff * -1;
  el.textContent = val === 0 ? "–" : `${val > 0 ? '+' : ''}${val}%`;
});
document.querySelectorAll('[data-var="sport-1-fat-diff"]').forEach(el => {
  const val = fatDiff * -1;
  el.textContent = val === 0 ? "–" : `${val > 0 ? '+' : ''}${val}%`;
});
document.querySelectorAll('[data-var="sport-1-kcal-diff"]').forEach(el => {
  const val = kcalDiff * -1;
  el.textContent = val === 0 ? "–" : `${val > 0 ? '+' : ''}${val} kcals`;
});


}



function paintSection3(mainRow, sdfRow) {
  // Headline & subtitle
  let el = document.querySelector('[data-var="section3-header"]');
  if (el) el.textContent = "Under the Hood";

  el = document.querySelector('[data-var="section3-subtitle"]');
  if (el) el.textContent = "Let's dig in and see how each ingredient stacks up.";

  // Competitor block
  el = document.querySelector('[data-var="brand-1-sec3-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";

  // section3-madlib
  el = document.querySelector('[data-var="section3-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildIngredientMadlib(mainRow));
    el.textContent = '';
    el.removeAttribute('data-typed');
  }

  // table of counts
  el = document.querySelector('[data-var="brand-1-sec3-counts"]');
  if (el) el.innerHTML = buildCountsTable(mainRow, `${mainRow["data-brand"]} ${mainRow["data-one"]}`);

  // section3-contentious-madlib
  el = document.querySelector('[data-var="section3-contentious-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildSection4Madlib(mainRow));
    el.textContent = '';
    el.removeAttribute('data-typed');
  }

  // preview image (lazy)
  el = document.querySelector('[data-var="brand-1-sec3-previewimg"]');
  setLazyBackground(el, mainRow.previewengine);

  // ingredient list
  el = document.querySelector('[data-var="brand-1-sec3-inglist"]');
  if (el) el.innerHTML = renderIngListDivs(mainRow);

  // Sport Dog Food block
  el = document.querySelector('[data-var="sport-1-sec3-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";

  // section3-sport-madlib
  el = document.querySelector('[data-var="section3-sport-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildIngredientMadlib(sdfRow));
    el.textContent = '';
    el.removeAttribute('data-typed');
  }

  // sport counts table
  el = document.querySelector('[data-var="sport-1-sec3-counts"]');
  if (el) el.innerHTML = buildCountsTable(sdfRow, `Sport Dog Food ${sdfRow["data-one"]}`);

  // section3-sport-contentious-madlib
  el = document.querySelector('[data-var="section3-sport-contentious-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildSection4Madlib(sdfRow));
    el.textContent = '';
    el.removeAttribute('data-typed');
  }

  // sport preview image (lazy)
  el = document.querySelector('[data-var="sport-1-sec3-previewimg"]');
  setLazyBackground(el, sdfRow.previewengine);

  // sport ingredient list
  el = document.querySelector('[data-var="sport-1-sec3-inglist"]');
  if (el) el.innerHTML = renderIngListDivs(sdfRow);
}


function paintSvgIcon(selector, isPositive) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = isPositive
    ? `<img src="https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41/6875436c41c99b786922c0bf_ckicon.svg" alt="Check" class="icon-status-svg" />`
    : `<img src="https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41/6875436b4862ce5c6ee377e7_xicon.svg" alt="X" class="icon-status-svg" />`;
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
  madlibEl.textContent = '';
  madlibEl.removeAttribute('data-typed');

  // Kick off Typed.js
  new Typed(madlibEl, {
    strings: [text],
    typeSpeed: 26,
    showCursor: false
  });
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
  if (!el || el.getAttribute("data-typed") === "true") return;
  const str = el.getAttribute("data-text");
  if (!str) return;

  el.textContent = '';
  el.setAttribute("data-typed", "true");
  new Typed(el, {
    strings: [str],
    typeSpeed: 24,
    showCursor: false
  });
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
    }
  },
 {
  id: '#section-3',
  fn: () => {
    paintSection3(mainRow, sdfRow);
    // animate each madlib slot
    [
      'section3-madlib',
      'section3-sport-madlib',
      'section3-contentious-madlib',
      'section3-sport-contentious-madlib'
    ].forEach(runTypedForMadlib);
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
  const mainRow  = CI_DATA.find(r => r['data-five'] === mainFive);

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

  // 4. Lazy-load painting on scroll
  lazyLoadCompareSections(mainRow, initialRow);

  // 5. Wire up the buttons
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
        paintSection1(mainRow, newRow);
        paintSection2(mainRow, newRow);
        paintSection3(mainRow, newRow);
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

  // 6. Finally, kick off the switcher
  setupSdfSwitcher(initialId);
}

