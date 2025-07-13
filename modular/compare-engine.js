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

// Usage:
// paintCompareShell();
// Then initialize the rest of your engine/logic (pills, suggestions, handlers)
// compare-engine.js
import { CI_DATA } from './ci.js';
import { CF_DATA } from './cf.js';
import { ING_ANIM } from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP } from './ingSupp.js';

// SDF data-fives
const SDF_FORMULAS = {
  cub: "29280",
  dock: "29099",
  herding: "28979",
};
const SDF_LIST = [SDF_FORMULAS.cub, SDF_FORMULAS.dock, SDF_FORMULAS.herding];

function getSdfFormula(data) {
  if (data["data-grain"]?.toLowerCase().includes("grain free")) return SDF_FORMULAS.herding;
  if (+data["ga_kcals_per_cup"] > 490) return SDF_FORMULAS.cub;
  return SDF_FORMULAS.dock;
}

function getCiRow(dataFive) {
  return CI_DATA.find(row => String(row["data-five"]) === String(dataFive));
}
function getCfRow(dataFive) {
  return CF_DATA.find(row => String(row["data-five"]) === String(dataFive));
}

// --- Ingredient map (merge all)
const ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

function getIngredientsList(row) {
  return (row["ing-data-fives"] || [])
    .map(id => ING_MAP[id])
    .filter(Boolean)
    .map(ing => ing.displayAs || ing.Name)
    .join(", ");
}

function getContentiousIngredients(row) {
  return (row["ing-data-fives"] || [])
    .map(id => ING_MAP[id])
    .filter(ing => ing?.tagContentious)
    .map(ing => ing.displayAs)
    .join(", ");
}

function buildSectionMarkup({ id, title, subtitle, madlib, pills }) {
  return `
    <section id="${id}" class="ci-section">
      <div class="ci-section-header">
        <h2 class="ci-section-title">${title}</h2>
        <div class="ci-section-subtitle">${subtitle}</div>
        <div class="ci-section-pills">${(pills || []).map(p => `<button class="ci-pill">${p}</button>`).join('')}</div>
      </div>
      <p class="ci-section-madlib">${madlib}</p>
    </section>
  `;
}

// --- Main Compare Logic ---
export function renderComparePage() {
  const ciFive  = document.getElementById('item-faq-five')?.value;
  const ciType  = document.getElementById('item-faq-type')?.value;
  if (!ciFive || !ciType) return;
  const mainRow = getCiRow(ciFive);
  if (!mainRow) return;

  // Select comparison SDF formula
  const sdfFive = getSdfFormula(mainRow);
  const sdfRow  = getCiRow(sdfFive);

  // Section 1: Diet & Major Specs (side-by-side flavor, diet, poultry, legumes)
  const sideBySide1 = `
    <table class="ci-sidebyside-table">
      <tr>
        <th></th>
        <th>${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
        <th>Sport Dog Food ${sdfRow["data-one"]}</th>
      </tr>
      <tr>
        <td>Primary Flavor</td>
        <td>${mainRow["specs_primary_flavor"] || ""}</td>
        <td>${sdfRow["specs_primary_flavor"] || ""}</td>
      </tr>
      <tr>
        <td>Grain</td>
        <td>${mainRow["data-grain"] || ""}</td>
        <td>${sdfRow["data-grain"] || ""}</td>
      </tr>
      <tr>
        <td>Poultry</td>
        <td>${mainRow["data-poultry"] || ""}</td>
        <td>${sdfRow["data-poultry"] || ""}</td>
      </tr>
      <tr>
        <td>Legumes</td>
        <td>${mainRow["data-legumes"] || ""}</td>
        <td>${sdfRow["data-legumes"] || ""}</td>
      </tr>
    </table>
  `;

function section1DietSpecs(mainRow, sdfRow) {
  return `
  <section id="diet" class="ci-section">
    <div class="ci-section-header">
      <h2 class="ci-section-title">Diet & Key Specs</h2>
      <div class="ci-section-subtitle">
        Comparing <span class="ci-prod">${mainRow["data-brand"]} ${mainRow["data-one"]}</span>
        vs. <span class="ci-prod">Sport Dog Food ${sdfRow["data-one"]}</span>
      </div>
    </div>
    <table class="ci-sidebyside-table">
      <tr>
        <th></th>
        <th>${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
        <th>Sport Dog Food ${sdfRow["data-one"]}</th>
      </tr>
      <tr>
        <td>Primary Flavor</td>
        <td>${mainRow["specs_primary_flavor"] || ""}</td>
        <td>${sdfRow["specs_primary_flavor"] || ""}</td>
      </tr>
      <tr>
        <td>Grain Free</td>
        <td>${(mainRow["data-grain"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
        <td>${(sdfRow["data-grain"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
      </tr>
      <tr>
        <td>Poultry Free</td>
        <td>${(mainRow["data-poultry"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
        <td>${(sdfRow["data-poultry"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
      </tr>
      <tr>
        <td>Legumes Free</td>
        <td>${(mainRow["data-legumes"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
        <td>${(sdfRow["data-legumes"]||"").toLowerCase().includes("free") ? "✔" : ""}</td>
      </tr>
    </table>
    <p class="ci-section-madlib">
      ${(mainRow["data-brand"] || "This food")} ${mainRow["data-one"]} is a ${(mainRow["data-grain"]||"grain-inclusive").toLowerCase()} formula${mainRow["ga_kcals_per_cup"] ? ` with ${mainRow["ga_kcals_per_cup"]} kcals/cup.` : '.'}
      Sport Dog Food ${sdfRow["data-one"]} is the comparison baseline.
    </p>
  </section>
  `;
}

function nutrientTag(val, tag) {
  if (!tag) return "";
  return `<span class="ci-tag ci-tag-${tag.toLowerCase()}">${tag}</span>`;
}
function tagText(label, tag) {
  if (!tag) return "";
  return `${label} is tagged as <span class="ci-tag-inline ci-tag-${tag.toLowerCase()}">${tag}</span>. `;
}

function section2Macros(mainRow, sdfRow) {
  const nutSummary = `
    ${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"]}% protein, ${mainRow["ga_crude_fat_%"]}% fat, and ${mainRow["ga_kcals_per_cup"]} kcals/cup.
    ${tagText("Protein", mainRow["tag_protein"])}
    ${tagText("Fat", mainRow["tag_fat"])}
    ${tagText("Calories", mainRow["tag_kcalscup"])}
  `.replace(/\s+/g, ' ').trim();

  return `
  <section id="specs" class="ci-section">
    <div class="ci-section-header">
      <h2 class="ci-section-title">Macronutrient Breakdown</h2>
      <div class="ci-section-subtitle">Protein, fat, calorie details, and flavor</div>
    </div>
    <table class="ci-sidebyside-table">
      <tr>
        <th></th>
        <th>${mainRow["data-brand"]} ${mainRow["data-one"]}</th>
        <th>Sport Dog Food ${sdfRow["data-one"]}</th>
      </tr>
      <tr>
        <td>Protein</td>
        <td>${mainRow["ga_crude_protein_%"] || ""}%${nutrientTag(mainRow["ga_crude_protein_%"], mainRow["tag_protein"])}</td>
        <td>${sdfRow["ga_crude_protein_%"] || ""}%${nutrientTag(sdfRow["ga_crude_protein_%"], sdfRow["tag_protein"])}</td>
      </tr>
      <tr>
        <td>Fat</td>
        <td>${mainRow["ga_crude_fat_%"] || ""}%${nutrientTag(mainRow["ga_crude_fat_%"], mainRow["tag_fat"])}</td>
        <td>${sdfRow["ga_crude_fat_%"] || ""}%${nutrientTag(sdfRow["ga_crude_fat_%"], sdfRow["tag_fat"])}</td>
      </tr>
      <tr>
        <td>Calories/cup</td>
        <td>${mainRow["ga_kcals_per_cup"] || ""}${nutrientTag(mainRow["ga_kcals_per_cup"], mainRow["tag_kcalscup"])}</td>
        <td>${sdfRow["ga_kcals_per_cup"] || ""}${nutrientTag(sdfRow["ga_kcals_per_cup"], sdfRow["tag_kcalscup"])}</td>
      </tr>
      <tr>
        <td>Flavor</td>
        <td>${mainRow["specs_primary_flavor"] || ""}</td>
        <td>${sdfRow["specs_primary_flavor"] || ""}</td>
      </tr>
    </table>
    <div class="ci-madlib-text">${nutSummary}</div>
  </section>
  `;
}
// ---------- Section 3: Ingredient List & Attribute Table (Full Render) ----------

// Helper: merge all ingredient data
const ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// Helper: Get ingredient attribute counts for a formula row
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

// Helper: Attribute count table for main vs SDF
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
        <tr><td>Total ingredients</td><td>${mainCounts.total}</td><td>${sdfCounts.total}</td></tr>
        <tr><td>Poultry</td><td>${mainCounts.poultry}</td><td>${sdfCounts.poultry}</td></tr>
        <tr><td>Allergy</td><td>${mainCounts.allergy}</td><td>${sdfCounts.allergy}</td></tr>
        <tr><td>Contentious</td><td>${mainCounts.contentious}</td><td>${sdfCounts.contentious}</td></tr>
        <tr><td>Minerals</td><td>${mainCounts.minerals}</td><td>${sdfCounts.minerals}</td></tr>
        <tr><td>Vitamins</td><td>${mainCounts.vitamins}</td><td>${sdfCounts.vitamins}</td></tr>
        <tr><td>Probiotics</td><td>${mainCounts.probiotics}</td><td>${sdfCounts.probiotics}</td></tr>
        <tr><td>Upgraded Minerals</td><td>${mainCounts.upgradedMinerals}</td><td>${sdfCounts.upgradedMinerals}</td></tr>
      </tbody>
    </table>
  `;
}

// Helper: Madlib summary for main formula
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

// Helper: Styled list of all ingredients with tags (main OR SDF)
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

// ----------- Drop this in your renderComparePage -----------

// Inside renderComparePage (after you have mainRow and sdfRow):
const mainCounts = getIngredientCounts(mainRow);
const sdfCounts = getIngredientCounts(sdfRow);

const section3 = `
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

// ...Then inject `section3` in your main page HTML output where needed

// For example:
const compareRoot = document.getElementById('compare-root');
if (compareRoot) {
  // ...build section1, section2 first...
  compareRoot.innerHTML += section3;
}

function getContentiousIngredients(row) {
  const ids = Array.isArray(row["ing-data-fives"]) ? row["ing-data-fives"] : [];
  const ings = ids.map(id => ING_MAP[id]).filter(Boolean);
  return ings.filter(ing => ing.tagContentious).map(ing => ing.displayAs).filter(Boolean);
}
function joinWithAnd(arr) {
  if (arr.length <= 1) return arr.join('');
  if (arr.length === 2) return arr[0] + " and " + arr[1];
  return arr.slice(0, -1).join(", ") + " and " + arr.slice(-1);
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

  // Section 5: Feeding Calculator (unchanged)
  const section5 = buildSectionMarkup({
    id: "calcs",
    title: "Feeding Calculator",
    subtitle: "Estimate daily cost & portions",
    madlib: `Enter your dog's weight to estimate feeding needs and cost per day.`
  });

  // Render all sections (replace #compare-root)
  const compareRoot = document.getElementById('compare-root');
  if (compareRoot) {
    compareRoot.innerHTML = section1 + section2 + section3 + section4 + section5;
  }
}

