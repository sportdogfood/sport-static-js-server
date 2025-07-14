// compare-engine.js (initial shell paint for CCI)
// Call this as soon as DOM is ready and hidden fields are set

export function paintCompareShell({
  containerSelector = '.pwr-section-container',
  brand = 'the competition',
  inputPresets = [
    "Type: Purina Pro Plan",
    "Try: Grain Free"
  ]
} = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('[CCI] Container not found:', containerSelector);
    return;
  }

  // --- HTML shell (matches your computed markup) ---
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

  // --- Dynamic hero label (randomized) ---
  const heroPresets = [
    `See how our diets outwork <span class='brand-highlight'>${brand}</span>`,
    `Discover what sets us apart from <span class='brand-highlight'>${brand}</span>`
  ];
  const label = container.querySelector('#pwr-fake-label');
  if (label) label.innerHTML = heroPresets[Math.floor(Math.random() * heroPresets.length)];

  // --- Animated placeholder for search input ---
  const input = container.querySelector('#pwr-prompt-input');
  let i = 0;
  if (input && inputPresets.length > 1) {
    input.placeholder = inputPresets[0];
    setInterval(() => {
      i = (i + 1) % inputPresets.length;
      input.placeholder = inputPresets[i];
    }, 4000);
  }
}

// compare-engine.js - Drop-in for CI compare pages

// Import your datasets
import { CI_DATA }   from './ci.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';

// --- SDF "baseline" formulas by data-five
const SDF_FORMULAS = {
  cub:     "29280",
  dock:    "29099",
  herding: "28979"
};

// --- INGREDIENT LOOKUP MAP
const ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// --- UTILS ---
function getSdfFormula(row) {
  // Pick baseline SDF formula by grain/kcals
  if ((row["data-grain"] || "").toLowerCase().includes("grain free")) return SDF_FORMULAS.herding;
  if (+row["ga_kcals_per_cup"] > 490) return SDF_FORMULAS.cub;
  return SDF_FORMULAS.dock;
}
function getCiRow(dataFive) {
  return CI_DATA.find(row => String(row["data-five"]) === String(dataFive));
}
function safeStr(val) { return typeof val === "string" ? val : ""; }
function nutrientTag(val, tag) {
  if (!tag) return "";
  return `<span class="ci-tag ci-tag-${tag.toLowerCase()}">${tag}</span>`;
}
function tagText(label, tag) {
  if (!tag) return "";
  return `${label} is tagged as <span class="ci-tag-inline ci-tag-${tag.toLowerCase()}">${tag}</span>. `;
}
function joinWithAnd(arr) {
  if (arr.length <= 1) return arr.join('');
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + " and " + arr.slice(-1);
}

// --- SECTION 1: Diet & Key Specs ---
// --- SECTION 1: Diet & Key Specs ---
function paintSection1(mainRow, sdfRow) {
  // Section Header/Title
  var headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Diet & Key Specs";

  // Section Subtitle
  var subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) subtitleEl.textContent =
    `Comparing ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;

  // Section Madlib
  var madlibEl = document.querySelector('[data-var="section1-madlib"]');
  if (madlibEl) madlibEl.textContent =
    `${mainRow["data-brand"]} ${mainRow["data-one"]} is a ${(mainRow["data-grain"] || "grain-inclusive").toLowerCase()} formula with ${mainRow["ga_kcals_per_cup"] || "?"} kcals/cup. Sport Dog Food ${sdfRow["data-one"]} is the comparison baseline.`;

  // --- Brand 1 (main/competitor) ---
  var el;
  el = document.querySelector('[data-var="brand-1-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";
  el = document.querySelector('[data-var="brand-1-brand"]');
  if (el) el.textContent = mainRow["data-brand"] || "";
  el = document.querySelector('[data-var="brand-1-flavor"]');
  if (el) el.textContent = mainRow["specs_primary_flavor"] || "";
  el = document.querySelector('[data-var="brand-1-firsting"]');
  if (el) el.textContent = mainRow["ing-first"] || "";
  el = document.querySelector('[data-var="brand-1-seconding"]');
  if (el) el.textContent = mainRow["ing-second"] || "";
  el = document.querySelector('[data-var="brand-1-diet"]');
  if (el) el.textContent = mainRow["data-diet"] || mainRow["data-grain"] || "";

  el = document.querySelector('[data-var="brand-1-previewimg"]');
  // Use previewengine
  if (el && mainRow.previewengine) {
    el.style.setProperty("background-image", `url(${mainRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }

  paintSvgIcon('[data-var="brand-1-legumesfree"]', !!mainRow["data-legumes"] && mainRow["data-legumes"].toLowerCase().includes("free"));
  paintSvgIcon('[data-var="brand-1-poultryfree"]', !!mainRow["data-poultry"] && mainRow["data-poultry"].toLowerCase().includes("free"));
  paintSvgIcon('[data-var="brand-1-upgradedmin"]', !!mainRow.hasUpgradedMinerals);

  // --- Sport Dog Food (SDF) ---
  el = document.querySelector('[data-var="sport-1-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";
  el = document.querySelector('[data-var="sport-1-brand"]');
  if (el) el.textContent = "Sport Dog Food";
  el = document.querySelector('[data-var="sport-1-flavor"]');
  if (el) el.textContent = sdfRow["specs_primary_flavor"] || "";
  el = document.querySelector('[data-var="sport-1-firsting"]');
  if (el) el.textContent = sdfRow["ing-first"] || "";
  el = document.querySelector('[data-var="sport-1-seconding"]');
  if (el) el.textContent = sdfRow["ing-second"] || "";
  el = document.querySelector('[data-var="sport-1-diet"]');
  if (el) el.textContent = sdfRow["data-diet"] || sdfRow["data-grain"] || "";

  el = document.querySelector('[data-var="sport-1-previewimg"]');
  // Use previewengine for SDF also if you have it, otherwise fallback to "" (blank)
  if (el && sdfRow.previewengine) {
    el.style.setProperty("background-image", `url(${sdfRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }

  paintSvgIcon('[data-var="sport-1-legumesfree"]', !!sdfRow["data-legumes"] && sdfRow["data-legumes"].toLowerCase().includes("free"));
  paintSvgIcon('[data-var="sport-1-poultryfree"]', !!sdfRow["data-poultry"] && sdfRow["data-poultry"].toLowerCase().includes("free"));
  paintSvgIcon('[data-var="sport-1-upgradedmin"]', !!sdfRow.hasUpgradedMinerals);
}

// --- Utility: Paint SVG icon for check/X status ---
function paintSvgIcon(selector, isPositive) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML =
    isPositive
      ? `<img src="https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41/6875436c41c99b786922c0bf_ckicon.svg" alt="Check" class="icon-status-svg" />`
      : `<img src="https://cdn.prod.website-files.com/5c919f089b1194a099fe6c41/6875436b4862ce5c6ee377e7_xicon.svg" alt="X" class="icon-status-svg" />`;
}



// --- SECTION 2: Macronutrient Breakdown & Energy ---
function paintSection2(mainRow, sdfRow) {
  // Section Header/Title
  var headerEl = document.querySelector('[data-var="section2-header"]');
  if (headerEl) headerEl.textContent = "Macronutrient Breakdown";

  // Section Subtitle
  var subtitleEl = document.querySelector('[data-var="section2-subtitle"]');
  if (subtitleEl) subtitleEl.textContent =
    `Protein, fat, and calories per cup for each diet.`;

  // Section Madlib
  var madlibEl = document.querySelector('[data-var="section2-madlib"]');
  if (madlibEl) madlibEl.textContent =
    `${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"] || "?"}% protein, ${mainRow["ga_crude_fat_%"] || "?"}% fat, and ${mainRow["ga_kcals_per_cup"] || "?"} kcals/cup. Sport Dog Food ${sdfRow["data-one"]} provides ${sdfRow["ga_crude_protein_%"] || "?"}% protein, ${sdfRow["ga_crude_fat_%"] || "?"}% fat, and ${sdfRow["ga_kcals_per_cup"] || "?"} kcals/cup.`;

  // --- Brand 1 (main/competitor) ---
  var el;
  el = document.querySelector('[data-var="brand-1-sec2-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";
  el = document.querySelector('[data-var="brand-1-protein"]');
  if (el) el.textContent = mainRow["ga_crude_protein_%"] || "";
  el = document.querySelector('[data-var="brand-1-fat"]');
  if (el) el.textContent = mainRow["ga_crude_fat_%"] || "";
  el = document.querySelector('[data-var="brand-1-kcalscup"]');
  if (el) el.textContent = mainRow["ga_kcals_per_cup"] || "";
  el = document.querySelector('[data-var="brand-1-kcalskg"]');
  if (el) el.textContent = mainRow["ga_kcals_per_kg"] || "";

  // --- Sport 1 (Sport Dog Food) ---
  el = document.querySelector('[data-var="sport-1-sec2-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";
  el = document.querySelector('[data-var="sport-1-protein"]');
  if (el) el.textContent = sdfRow["ga_crude_protein_%"] || "";
  el = document.querySelector('[data-var="sport-1-fat"]');
  if (el) el.textContent = sdfRow["ga_crude_fat_%"] || "";
  el = document.querySelector('[data-var="sport-1-kcalscup"]');
  if (el) el.textContent = sdfRow["ga_kcals_per_cup"] || "";
  el = document.querySelector('[data-var="sport-1-kcalskg"]');
  if (el) el.textContent = sdfRow["ga_kcals_per_kg"] || "";
}



// ------- SECTION 3: Ingredient List & Attribute Table -------

// Map granular data-type to consumer-facing group label
function getConsumerTypeTag(type) {
  if (!type) return "";
  const t = type.toLowerCase();
  if (["fish", "meat", "poultry"].includes(t)) return "Protein";
  if (["legumes", "botanical", "fruit", "grain", "roots", "seed oil", "vegetable", "fiber", "seeds", "herb", "fish oil"].includes(t)) return "Plants";
  if (["digestive enzyme", "vitamins", "probiotics", "yeast", "minerals", "preservative", "colorant", "joint support", "prebiotic", "amino acid", "flavor enhancer"].includes(t)) return "Supplemental";
  return "Other";
}

// Count ingredients by group (for your "data-type" values)
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

// Build ingredient count table (side-by-side, by group)
function buildIngredientCategoryTable(mainRow, sdfRow) {
  const mainCounts = getIngredientCategoryCounts(mainRow);
  const sdfCounts  = getIngredientCategoryCounts(sdfRow);
  return `
    <table class="ci-ingredient-attr-table">
      <thead>
        <tr>
          <th>&nbsp;</th>
          <th>${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
          <th>Sport Dog Food ${sdfRow["data-one"]}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Total ingredients</td>   <td>${mainCounts.total}</td><td>${sdfCounts.total}</td></tr>
        <tr><td>Protein</td>             <td>${mainCounts.Protein}</td><td>${sdfCounts.Protein}</td></tr>
        <tr><td>Plants</td>              <td>${mainCounts.Plants}</td><td>${sdfCounts.Plants}</td></tr>
        <tr><td>Supplemental</td>        <td>${mainCounts.Supplemental}</td><td>${sdfCounts.Supplemental}</td></tr>
        ${(mainCounts.Other || sdfCounts.Other) ? `<tr><td>Other</td><td>${mainCounts.Other}</td><td>${sdfCounts.Other}</td></tr>` : ""}
      </tbody>
    </table>
  `;
}

// Madlib for ingredient summary
function buildIngredientMadlib(row, counts) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  let madlib = `${counts.total} ingredients evaluated.`;
  if (ings[0]) madlib += ` First ingredient: ${ings[0].displayAs || ings[0].Name}.`;
  if (ings[1]) madlib += ` Second ingredient: ${ings[1].displayAs || ings[1].Name}.`;

  const allergyIngs = ings.filter(ing => ing.tagAllergy).map(ing => ing.displayAs).join(', ');
  const contentiousIngs = ings.filter(ing => ing.tagContentious).map(ing => ing.displayAs).join(', ');

  if (allergyIngs) madlib += ` Contains allergy ingredients (${allergyIngs}).`;
  if (contentiousIngs) madlib += ` Contains contentious ingredients (${contentiousIngs}).`;

  const hasUpgraded = ings.some(ing =>
    (ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
    (ing.supplementalAssist || "").toLowerCase().includes("complex")
  );
  if (!hasUpgraded) madlib += ` This formula does not include upgraded minerals where Sport Dog Food does.`;

  return madlib;
}

// Render ingredient divs (all tags included, no span)
function renderIngListDivs(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  return `
    <div class="ci-ings-list">
      ${ings.map(ing => {
        let tagDivs = [];
        // New consumer group tag (from data-type)
        if (ing["data-type"]) {
          tagDivs.push(
            `<div class="ci-ing-tag ci-tag-default ci-tag-${getConsumerTypeTag(ing["data-type"]).toLowerCase()}">${getConsumerTypeTag(ing["data-type"])}</div>`
          );
        }
        // Old/classic tags
        if (ing.tagPoultry)     tagDivs.push(`<div class="ci-ing-tag ci-tag-poultry">poultry</div>`);
        if (ing.tagAllergy)     tagDivs.push(`<div class="ci-ing-tag ci-tag-allergy">allergy</div>`);
        if (ing.tagContentious) tagDivs.push(`<div class="ci-ing-tag ci-tag-contentious">contentious</div>`);
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
            <div class="ci-ing-tag-wrapper">${tagDivs.join("")}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// --- SECTION 3 MAIN RENDER FUNCTION ---
function section3Ingredients(mainRow, sdfRow) {
  const mainCounts = getIngredientCategoryCounts(mainRow);
  const sdfCounts  = getIngredientCategoryCounts(sdfRow);

  return `
    <section class="ci-section" id="ingredients">
      <div class="ci-section-title-wrapper">
        <h2 class="ci-section-header ci-section-title">Ingredient List</h2>
        <div class="ci-section-subtitle">
          <p class="subtitle-text">See what’s inside (hover tags for info)</p>
        </div>
      </div>
      <div class="ci-sidebyside-wrapper">
        ${buildIngredientCategoryTable(mainRow, sdfRow)}
      </div>
      <div class="ci-section-madlib-wrapper">
        <div class="ci-section-madlib">
          <p class="madlib-p">${buildIngredientMadlib(mainRow, mainCounts)}</p>
        </div>
      </div>
      <div class="ci-ings-container">
        <div class="ci-ings-wrapper">
          <div class="ci-ings-label"><b>${mainRow["data-brand"]} ${mainRow["data-one"]} ingredients (${mainCounts.total}):</b></div>
          ${renderIngListDivs(mainRow)}
        </div>
        <div class="ci-ings-wrapper">
          <div class="ci-ings-label"><b>Sport Dog Food ${sdfRow["data-one"]} ingredients (${sdfCounts.total}):</b></div>
          ${renderIngListDivs(sdfRow)}
        </div>
      </div>
    </section>
  `;
}



// --- SECTION 4: Contentious Ingredients ---
function getContentiousIngredients(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);
  return ings.filter(ing => ing.tagContentious).map(ing => ing.displayAs).filter(Boolean);
}
function buildSection4Madlib(mainRow) {
  const brand = mainRow["data-brand"];
  const product = mainRow["data-one"];
  const excluded = getContentiousIngredients(mainRow);
  if (excluded.length === 0) {
    return `There are no contentious ingredients in ${brand} ${product}.`;
  }
  if (excluded.length === 1) {
    return `${brand} ${product} contains ${excluded[0]}, which is not found in any Sport Dog Food formula.`;
  }
  return `With ${brand} ${product} you'll find ingredients like ${joinWithAnd(excluded)}. Those are ingredients you won't find in any Sport Dog Food formulas.`;
}


function section4Contentious(mainRow) {
  return `
    <section class="ci-section" id="contentious">
      <div class="ci-section-title-wrapper">
        <h2 class="ci-section-header ci-section-title">Contentious Ingredients</h2>
        <div class="ci-section-subtitle">
          <p class="subtitle-text">Excluded by Sport Dog Food</p>
        </div>
      </div>
      <div class="ci-section-madlib-wrapper">
        <div class="ci-section-madlib">
          <p class="madlib-p">${buildSection4Madlib(mainRow)}</p>
        </div>
      </div>
    </section>
  `;
}


// --- MAIN RENDER --- 
export function renderComparePage() {
  // Grab which CI item is being viewed
  const ciFive  = document.getElementById('item-faq-five')?.value;
  const ciType  = document.getElementById('item-faq-type')?.value;
  if (!ciFive || !ciType) return;
  const mainRow = getCiRow(ciFive);
  if (!mainRow) return;

  // Pick which SDF formula to use for baseline
  const sdfFive = getSdfFormula(mainRow);
  const sdfRow  = getCiRow(sdfFive);

  // Drop in empty containers for each section (this is only done once per load)
  const compareRoot = document.getElementById('compare-root');
  if (!compareRoot) return;
  compareRoot.innerHTML = `
    <div id="section-1"></div>
    <div id="section-2"></div>
    <div id="section-3"></div>
    <div id="section-4"></div>
  `;

  // --- NEW: Paint Section 1 via slot/vars, not HTML injection
  paintSection1(mainRow, sdfRow);  // <-- Use your data-var method here

  // --- OLD: Paint Sections 2/3/4 via innerHTML
  document.getElementById('section-2').innerHTML = section2Macros(mainRow, sdfRow);
  document.getElementById('section-3').innerHTML = section3Ingredients(mainRow, sdfRow);
  document.getElementById('section-4').innerHTML = section4Contentious(mainRow);
}
