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

  const section1 = buildSectionMarkup({
    id: "diet",
    title: "Diet & Key Specs",
    subtitle: `Comparing <span class="ci-prod">${mainRow["data-brand"]} ${mainRow["data-one"]}</span> vs. <span class="ci-prod">Sport Dog Food ${sdfRow["data-one"]}</span>`,
    madlib: sideBySide1,
  });

  // Section 2: Protein, Fat, Calories, Flavor, tag (side-by-side)
  function nutrientTag(val, tag) {
    return tag && tag !== "" ? `<span class="ci-tag ${tag}">${tag}</span>` : "";
  }
  const sideBySide2 = `
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
    </table>
  `;
  // Build readable text for tags (protein/fat/kcals)
  function tagText(label, tag) {
    return tag && tag !== "" ? `${label} is tagged as <span class="ci-tag-inline ${tag}">${tag}</span>. ` : "";
  }
  const nutSummary = `
    ${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"]}% protein, ${mainRow["ga_crude_fat_%"]}% fat, and ${mainRow["ga_kcals_per_cup"]} kcals/cup.
    ${tagText("Protein", mainRow["tag_protein"])}${tagText("Fat", mainRow["tag_fat"])}${tagText("Calories", mainRow["tag_kcalscup"])}
  `.replace(/\s+/g, ' ').trim();

  const section2 = buildSectionMarkup({
    id: "specs",
    title: "Macronutrient Breakdown",
    subtitle: "Protein, fat, calorie details, and flavor",
    madlib: sideBySide2 + `<div class="ci-madlib-text">${nutSummary}</div>`
  });

  // Section 3: Ingredient List with tags/counts
  function ingredientListWithTags(row) {
    const ings = (row["ing-data-fives"] || []).map(id => ING_MAP[id]).filter(Boolean);
    let tagsCount = { poultry: 0, allergy: 0, contentious: 0, total: ings.length };
    const ingsHtml = ings.map(ing => {
      let tags = [];
      if (ing.tagPoultry)   { tags.push('<span class="ci-ing-tag poultry">poultry</span>'); tagsCount.poultry++; }
      if (ing.tagAllergy)   { tags.push('<span class="ci-ing-tag allergy">allergy</span>'); tagsCount.allergy++; }
      if (ing.tagContentious) { tags.push('<span class="ci-ing-tag contentious">contentious</span>'); tagsCount.contentious++; }
      return `<span class="ci-ing">${ing.displayAs || ing.Name}${tags.length ? ' ' + tags.join(' ') : ''}</span>`;
    }).join(', ');
    return { html: ingsHtml, counts: tagsCount };
  }

  const mainIngs = ingredientListWithTags(mainRow);
  const sdfIngs  = ingredientListWithTags(sdfRow);

  const section3 = buildSectionMarkup({
    id: "ingredients",
    title: "Ingredient List",
    subtitle: "See what’s inside (hover tags for info)",
    madlib: `
      <b>${mainRow["data-brand"]} ${mainRow["data-one"]}</b> ingredients (${mainIngs.counts.total}):<br>${mainIngs.html}
      <br><b>Sport Dog Food ${sdfRow["data-one"]}</b> ingredients (${sdfIngs.counts.total}):<br>${sdfIngs.html}
    `
  });

  // Section 4: Contentious Ingredients w/ smarter madlib
  function prettyList(arr) {
    if (!arr.length) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return arr[0] + " and " + arr[1];
    return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  }
  const contentiousIngsArr = (mainRow["ing-data-fives"] || [])
    .map(id => ING_MAP[id])
    .filter(ing => ing?.tagContentious)
    .map(ing => ing.displayAs);

  let contMadlib = "";
  if (!contentiousIngsArr.length) {
    contMadlib = "No contentious ingredients in this formula.";
  } else if (contentiousIngsArr.length === 1) {
    contMadlib = `This formula contains <b>${contentiousIngsArr[0]}</b>, an ingredient not found in Sport Dog Food formulas.`;
  } else {
    contMadlib = `This formula contains the following ingredients not found in Sport Dog Food formulas: <b>${prettyList(contentiousIngsArr)}</b>.`;
  }

  const section4 = buildSectionMarkup({
    id: "contentious",
    title: "Contentious Ingredients",
    subtitle: "Excluded by Sport Dog Food",
    madlib: contMadlib
  });

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

