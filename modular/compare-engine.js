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
function section1DietSpecs(mainRow, sdfRow) {
  return `
  <section class="ci-section" id="diet">
    <div class="ci-section-title-wrapper">
      <h2 class="ci-section-header ci-section-title">Diet & Key Specs</h2>
      <div class="ci-section-subtitle">
        <p class="subtitle-text">
          Comparing <span class="ci-prod">${mainRow["data-brand"]} ${mainRow["data-one"]}</span>
          vs. <span class="ci-prod">Sport Dog Food ${sdfRow["data-one"]}</span>
        </p>
      </div>
    </div>
    <div class="ci-sidebyside-wrapper">
      <table class="ci-sidebyside-grid-1c4r">
        <thead>
          <tr class="ci-sidebyside-head-3c1r">
            <th class="ci-sidebyside-col-head"></th>
            <th class="ci-sidebyside-col-head">${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
            <th class="ci-sidebyside-col-head">Sport Dog Food ${sdfRow["data-one"]}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Primary Flavor</td>
            <td class="ci-sidebyside-col-row">${mainRow["specs_primary_flavor"] || ""}</td>
            <td class="ci-sidebyside-col-row">${sdfRow["specs_primary_flavor"] || ""}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Grain Free</td>
            <td class="ci-sidebyside-col-row">${(mainRow["data-grain"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
            <td class="ci-sidebyside-col-row">${(sdfRow["data-grain"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Poultry Free</td>
            <td class="ci-sidebyside-col-row">${(mainRow["data-poultry"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
            <td class="ci-sidebyside-col-row">${(sdfRow["data-poultry"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Legumes Free</td>
            <td class="ci-sidebyside-col-row">${(mainRow["data-legumes"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
            <td class="ci-sidebyside-col-row">${(sdfRow["data-legumes"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="ci-section-madlib-wrapper">
      <div class="ci-section-madlib">
        <p class="madlib-p">
          ${(mainRow["data-brand"] || "This food")} ${mainRow["data-one"]} is a ${(mainRow["data-grain"]||"grain-inclusive").toLowerCase()} formula${mainRow["ga_kcals_per_cup"] ? ` with ${mainRow["ga_kcals_per_cup"]} kcals/cup.` : '.'}
          Sport Dog Food ${sdfRow["data-one"]} is the comparison baseline.
        </p>
      </div>
    </div>
  </section>
  `;
}


// --- SECTION 2: Macronutrient Breakdown ---
function section2Macros(mainRow, sdfRow) {
  const nutSummary = `
    ${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"]}% protein, ${mainRow["ga_crude_fat_%"]}% fat, and ${mainRow["ga_kcals_per_cup"]} kcals/cup.
    ${tagText("Protein", mainRow["tag_protein"])}
    ${tagText("Fat", mainRow["tag_fat"])}
    ${tagText("Calories", mainRow["tag_kcalscup"])}
  `.replace(/\s+/g, ' ').trim();

  return `
  <section class="ci-section" id="specs">
    <div class="ci-section-title-wrapper">
      <h2 class="ci-section-header ci-section-title">Macronutrient Breakdown</h2>
      <div class="ci-section-subtitle">
        <p class="subtitle-text">Protein, fat, calorie details, and flavor</p>
      </div>
    </div>
    <div class="ci-sidebyside-wrapper">
      <table class="ci-sidebyside-grid-1c4r">
        <thead>
          <tr class="ci-sidebyside-head-3c1r">
            <th class="ci-sidebyside-col-head"></th>
            <th class="ci-sidebyside-col-head">${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
            <th class="ci-sidebyside-col-head">Sport Dog Food ${sdfRow["data-one"]}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Protein</td>
            <td class="ci-sidebyside-col-row">${mainRow["ga_crude_protein_%"] || ""}%${nutrientTag(mainRow["ga_crude_protein_%"], mainRow["tag_protein"])}</td>
            <td class="ci-sidebyside-col-row">${sdfRow["ga_crude_protein_%"] || ""}%${nutrientTag(sdfRow["ga_crude_protein_%"], sdfRow["tag_protein"])}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Fat</td>
            <td class="ci-sidebyside-col-row">${mainRow["ga_crude_fat_%"] || ""}%${nutrientTag(mainRow["ga_crude_fat_%"], mainRow["tag_fat"])}</td>
            <td class="ci-sidebyside-col-row">${sdfRow["ga_crude_fat_%"] || ""}%${nutrientTag(sdfRow["ga_crude_fat_%"], sdfRow["tag_fat"])}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Calories/cup</td>
            <td class="ci-sidebyside-col-row">${mainRow["ga_kcals_per_cup"] || ""}${nutrientTag(mainRow["ga_kcals_per_cup"], mainRow["tag_kcalscup"])}</td>
            <td class="ci-sidebyside-col-row">${sdfRow["ga_kcals_per_cup"] || ""}${nutrientTag(sdfRow["ga_kcals_per_cup"], sdfRow["tag_kcalscup"])}</td>
          </tr>
          <tr class="ci-sidebyside-row-3c1r">
            <td class="ci-sidebyside-col-row">Flavor</td>
            <td class="ci-sidebyside-col-row">${mainRow["specs_primary_flavor"] || ""}</td>
            <td class="ci-sidebyside-col-row">${sdfRow["specs_primary_flavor"] || ""}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="ci-section-madlib-wrapper">
      <div class="ci-section-madlib">
        <p class="madlib-p">${nutSummary}</p>
      </div>
    </div>
  </section>
  `;
}

// ------- SECTION 3: Ingredient List & Attribute Table -------

// Ingredient attribute counts for a formula row
function getIngredientCounts(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);
  return {
    total: ings.length,
    poultry: ings.filter(ing => ing.tagPoultry).length,
    allergy: ings.filter(ing => ing.tagAllergy).length,
    contentious: ings.filter(ing => ing.tagContentious).length,
    minerals: ings.filter(ing => ing.supplementalType === "Minerals").length,
    vitamins: ings.filter(ing => ing.supplementalType === "Vitamins").length,
    probiotics: ings.filter(ing => ing.supplementalType === "Probiotics").length,
    upgradedMinerals: ings.filter(ing =>
      (ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
      (ing.supplementalAssist || "").toLowerCase().includes("complex")
    ).length
  };
}

// Build attribute count table for main and SDF
function buildIngredientTable(mainRow, sdfRow) {
  const mainCounts = getIngredientCounts(mainRow);
  const sdfCounts  = getIngredientCounts(sdfRow);

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
        <tr><td>Poultry</td>             <td>${mainCounts.poultry}</td><td>${sdfCounts.poultry}</td></tr>
        <tr><td>Allergy</td>             <td>${mainCounts.allergy}</td><td>${sdfCounts.allergy}</td></tr>
        <tr><td>Contentious</td>         <td>${mainCounts.contentious}</td><td>${sdfCounts.contentious}</td></tr>
        <tr><td>Minerals</td>            <td>${mainCounts.minerals}</td><td>${sdfCounts.minerals}</td></tr>
        <tr><td>Vitamins</td>            <td>${mainCounts.vitamins}</td><td>${sdfCounts.vitamins}</td></tr>
        <tr><td>Probiotics</td>          <td>${mainCounts.probiotics}</td><td>${sdfCounts.probiotics}</td></tr>
        <tr><td>Upgraded Minerals</td>   <td>${mainCounts.upgradedMinerals}</td><td>${sdfCounts.upgradedMinerals}</td></tr>
      </tbody>
    </table>
  `;
}

// Madlib summary for ingredient evaluation
function buildIngredientMadlib(row, counts) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  let madlib = `${counts.total} ingredients evaluated.`;
  if (ings[0]) madlib += ` First ingredient: ${ings[0].displayAs || ings[0].Name}.`;
  if (ings[1]) madlib += ` Second ingredient: ${ings[1].displayAs || ings[1].Name}.`;

  // Allergy/contentious logic
  const allergyIngs = ings.filter(ing => ing.tagAllergy).map(ing => ing.displayAs).join(', ');
  const contentiousIngs = ings.filter(ing => ing.tagContentious).map(ing => ing.displayAs).join(', ');

  if (allergyIngs) madlib += ` Contains allergy ingredients (${allergyIngs}).`;
  if (contentiousIngs) madlib += ` Contains contentious ingredients (${contentiousIngs}).`;

  // Upgraded minerals logic
  const hasUpgraded = ings.some(ing =>
    (ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
    (ing.supplementalAssist || "").toLowerCase().includes("complex")
  );
  if (!hasUpgraded) madlib += ` This formula does not include upgraded minerals where Sport Dog Food does.`;

  return madlib;
}

// Styled, tagged ingredient list (for mainRow or sdfRow)
function buildIngredientList(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);

  return ings.map(ing => {
    let tags = [];
    if (ing.tagPoultry)      tags.push(`<span class="ci-tag ci-tag-poultry">poultry</span>`);
    if (ing.tagAllergy)      tags.push(`<span class="ci-tag ci-tag-allergy">allergy</span>`);
    if (ing.tagContentious)  tags.push(`<span class="ci-tag ci-tag-contentious">contentious</span>`);
    if (ing.supplementalType === "Minerals")   tags.push(`<span class="ci-tag ci-tag-mineral">mineral</span>`);
    if (ing.supplementalType === "Vitamins")   tags.push(`<span class="ci-tag ci-tag-vitamin">vitamin</span>`);
    if (ing.supplementalType === "Probiotics") tags.push(`<span class="ci-tag ci-tag-probiotic">probiotic</span>`);
    if ((ing.supplementalAssist || "").toLowerCase().includes("chelate") ||
        (ing.supplementalAssist || "").toLowerCase().includes("complex")) {
      tags.push(`<span class="ci-tag ci-tag-upgraded">upgraded mineral</span>`);
    }
    return `${ing.displayAs || ing.Name}${tags.length ? " " + tags.join("") : ""}`;
  }).join(', ');
}

// ---------- SECTION 3 RENDER FUNCTION ----------
function section3Ingredients(mainRow, sdfRow) {
  const mainCounts = getIngredientCounts(mainRow);
  const sdfCounts  = getIngredientCounts(sdfRow);

  return `
    <section id="ingredients" class="ci-section">
      <div class="ci-section-header">
        <h2 class="ci-section-title">Ingredient List</h2>
        <div class="ci-section-subtitle">See what’s inside (hover tags for info)</div>
      </div>
      ${buildIngredientTable(mainRow, sdfRow)}
      <p class="ci-section-madlib">${buildIngredientMadlib(mainRow, mainCounts)}</p>
      <div class="ci-section-ingredient-list">
        <div>
          <b>${mainRow["data-brand"]} ${mainRow["data-one"]} ingredients (${mainCounts.total}):</b><br>
          ${buildIngredientList(mainRow)}
        </div>
        <div>
          <b>Sport Dog Food ${sdfRow["data-one"]} ingredients (${sdfCounts.total}):</b><br>
          ${buildIngredientList(sdfRow)}
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
    <section id="contentious" class="ci-section">
      <div class="ci-section-header">
        <h2 class="ci-section-title">Contentious Ingredients</h2>
        <div class="ci-section-subtitle">Excluded by Sport Dog Food</div>
      </div>
      <p class="ci-section-madlib">${buildSection4Madlib(mainRow)}</p>
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

  // Build all required sections
  const section1 = section1DietSpecs(mainRow, sdfRow);
  const section2 = section2Macros(mainRow, sdfRow);
  const section3 = section3Ingredients(mainRow, sdfRow);
  const section4 = section4Contentious(mainRow);

  // Drop in your HTML
  const compareRoot = document.getElementById('compare-root');
  if (compareRoot) {
    compareRoot.innerHTML = section1 + section2 + section3 + section4;
  }
}
