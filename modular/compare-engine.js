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

  // --- Section 1: Diet & Major Specs ---
  const section1 = buildSectionMarkup({
    id: "diet",
    title: "Diet & Key Specs",
    subtitle: `Comparing ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`,
    pills: [
      mainRow["specs_primary_flavor"],
      mainRow["data-grain"],
      mainRow["data-poultry"],
      mainRow["data-legumes"]
    ].filter(Boolean),
    madlib: `${mainRow["data-brand"]} ${mainRow["data-one"]} is a ${mainRow["data-grain"] || "grain-inclusive"} formula with ${mainRow["ga_kcals_per_cup"] || "N/A"} kcals/cup. Sport Dog Food ${sdfRow["data-one"]} is used for baseline comparison.`
  });

  // --- Section 2: Protein, Fat, Calories ---
  const section2 = buildSectionMarkup({
    id: "specs",
    title: "Macronutrient Breakdown",
    subtitle: "Protein, fat, and calorie details",
    pills: [
      mainRow["ga_crude_protein_%"] + "% Protein",
      mainRow["ga_crude_fat_%"] + "% Fat",
      mainRow["ga_kcals_per_cup"] + " kcals/cup"
    ].filter(Boolean),
    madlib: `${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"]}% protein, ${mainRow["ga_crude_fat_%"]}% fat, and ${mainRow["ga_kcals_per_cup"]} kcals/cup. ${mainRow["tag_protein"] ? `Protein is tagged as ${mainRow["tag_protein"]}.` : ""}`
  });

  // --- Section 3: Ingredients ---
  const mainIngs = getIngredientsList(mainRow);
  const sdfIngs  = getIngredientsList(sdfRow);
  const section3 = buildSectionMarkup({
    id: "ingredients",
    title: "Ingredient List",
    subtitle: "See what’s inside",
    madlib: `Ingredients in ${mainRow["data-brand"]} ${mainRow["data-one"]}: ${mainIngs}.<br>Sport Dog Food ${sdfRow["data-one"]}: ${sdfIngs}.`
  });

  // --- Section 4: Contentious/Excluded Ingredients ---
  const contentious = getContentiousIngredients(mainRow);
  const section4 = buildSectionMarkup({
    id: "contentious",
    title: "Contentious Ingredients",
    subtitle: "Excluded by Sport Dog Food",
    madlib: contentious
      ? `This formula contains the following ingredients that are not found in Sport Dog Food formulas: ${contentious}.`
      : "No contentious ingredients in this formula."
  });

  // --- Section 5: Feeding Calculator (Stub; replace logic with CF if needed) ---
  const section5 = buildSectionMarkup({
    id: "calcs",
    title: "Feeding Calculator",
    subtitle: "Estimate daily cost & portions",
    madlib: `Enter your dog's weight to estimate feeding needs and cost per day.`
  });

  // --- Render all sections (replace #compare-root) ---
  const compareRoot = document.getElementById('compare-root');
  if (compareRoot) {
    compareRoot.innerHTML = section1 + section2 + section3 + section4 + section5;
  }
}
