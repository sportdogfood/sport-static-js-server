import { CI_DATA }   from './ci.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';
//import Typed         from 'https://cdn.jsdelivr.net/npm/typed.js@2.0.12/lib/typed.esm.js';

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

function paintSection1(mainRow, sdfRow) {
  const headerEl = document.querySelector('[data-var="section1-header"]');
  if (headerEl) headerEl.textContent = "Diet & Key Specs";

  const subtitleEl = document.querySelector('[data-var="section1-subtitle"]');
  if (subtitleEl) subtitleEl.textContent =
    `Comparing ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;

  function getGrainPhrase(row) {
    const g = (row["data-diet"] || row["data-grain"] || "").toLowerCase();
    if (g.includes("free")) return "grain-free";
    if (g.includes("grain")) return "grain-inclusive";
    return "grain-inclusive";
  }
  function getMeatPhrase(row) {
    const flavor = (row["specs_primary_flavor"] || "").toLowerCase();
    if (flavor.includes("chicken") || flavor.includes("beef") || flavor.includes("fish") || flavor.includes("meat")) {
      return "meat-based";
    }
    return "animal-based";
  }
  function getLegumePhrase(row) {
    const val = (row["data-legumes"] || "").toLowerCase();
    if (val.includes("free") || val.includes("no")) return "It is legumes free";
    if (val.includes("yes")) return "It contains legumes";
    return "Legume content not specified";
  }
  function getPoultryPhrase(row) {
    const val = (row["data-poultry"] || "").toLowerCase();
    if (val.includes("free") || val.includes("no")) return "and it is poultry free";
    if (val.includes("yes") || val.includes("contain")) return "and it contains poultry";
    return "and poultry content not specified";
  }

  const mainBrand   = mainRow["data-brand"] || "Brand";
  const mainName    = mainRow["data-one"] || "Product";
  const sdfName     = sdfRow["data-one"] || "Sport Dog Food";
  const mainGrain   = getGrainPhrase(mainRow);
  const sdfGrain    = getGrainPhrase(sdfRow);
  const mainMeat    = getMeatPhrase(mainRow);
  const sdfMeat     = getMeatPhrase(sdfRow);
  const mainLegume  = getLegumePhrase(mainRow);
  const sdfLegume   = getLegumePhrase(sdfRow);
  const mainPoultry = getPoultryPhrase(mainRow);
  const sdfPoultry  = getPoultryPhrase(sdfRow);

  const madlib =
    `${mainBrand} ${mainName} is a ${mainGrain}, ${mainMeat} formula. ${mainLegume} ${mainPoultry}. ` +
    `${sdfName} is also a ${sdfGrain}, ${sdfMeat} formula. ${sdfLegume} ${sdfPoultry}.`;

  const madlibEl = document.querySelector('[data-var="section1-madlib"]');
  if (madlibEl) {
    madlibEl.setAttribute('data-text', madlib);
    madlibEl.textContent = '';
    madlibEl.removeAttribute('data-typed');
  }

  let el;
  el = document.querySelector('[data-var="brand-1-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";
  el = document.querySelector('[data-var="brand-1-brand"]');
  if (el) el.textContent = mainRow["data-brand"] || "";
  el = document.querySelector('[data-var="brand-1-flavor"]');
  if (el) el.textContent = mainRow["specs_primary_flavor"] || "";
  el = document.querySelector('[data-var="brand-1-diet"]');
  if (el) el.textContent = mainRow["data-diet"] || mainRow["data-grain"] || "";
  el = document.querySelector('[data-var="brand-1-previewimg"]');
  if (el && mainRow.previewengine) {
    el.style.setProperty("background-image", `url(${mainRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }
  paintSvgIcon('[data-var="brand-1-legumesfree"]',  mainRow["data-legumes"]?.toLowerCase().includes("free"));
  paintSvgIcon('[data-var="brand-1-poultryfree"]', mainRow["data-poultry"]?.toLowerCase().includes("free"));

  el = document.querySelector('[data-var="sport-1-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";
  el = document.querySelector('[data-var="sport-1-brand"]');
  if (el) el.textContent = "Sport Dog Food";
  el = document.querySelector('[data-var="sport-1-flavor"]');
  if (el) el.textContent = sdfRow["specs_primary_flavor"] || "";
  el = document.querySelector('[data-var="sport-1-diet"]');
  if (el) el.textContent = sdfRow["data-diet"] || sdfRow["data-grain"] || "";
  el = document.querySelector('[data-var="sport-1-previewimg"]');
  if (el && sdfRow.previewengine) {
    el.style.setProperty("background-image", `url(${sdfRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }
  paintSvgIcon('[data-var="sport-1-legumesfree"]',  sdfRow["data-legumes"]?.toLowerCase().includes("free"));
  paintSvgIcon('[data-var="sport-1-poultryfree"]', sdfRow["data-poultry"]?.toLowerCase().includes("free"));
}

function paintSection2(mainRow, sdfRow) {
  const headerEl   = document.querySelector('[data-var="section2-header"]');
  if (headerEl) headerEl.textContent = "Macronutrient Breakdown";

  const subtitleEl = document.querySelector('[data-var="section2-subtitle"]');
  if (subtitleEl) subtitleEl.textContent =
    `Protein, fat, and calorie details for ${mainRow["data-brand"]} ${mainRow["data-one"]} vs. Sport Dog Food ${sdfRow["data-one"]}`;

  const madlibEl = document.querySelector('[data-var="section2-madlib"]');
  if (madlibEl) {
    madlibEl.setAttribute('data-text',
      `${mainRow["data-brand"]} ${mainRow["data-one"]} provides ${mainRow["ga_crude_protein_%"] || "?"}% protein, ${mainRow["ga_crude_fat_%"] || "?"}% fat, and ${mainRow["ga_kcals_per_cup"] || "?"} kcals/cup. Sport Dog Food ${sdfRow["data-one"]} is shown for comparison.`
    );
    madlibEl.textContent = '';
    madlibEl.removeAttribute('data-typed');
  }

  let el;
  el = document.querySelector('[data-var="brand-1-sec2-previewimg"]');
  if (el && mainRow.previewengine) {
    el.style.setProperty("background-image", `url(${mainRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }

  el = document.querySelector('[data-var="sport-1-sec2-previewimg"]');
  if (el && sdfRow.previewengine) {
    el.style.setProperty("background-image", `url(${sdfRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }

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

  // ← corrected selector here (added missing dash)
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

function paintSection3(mainRow, sdfRow) {
  let el = document.querySelector('[data-var="section3-header"]');
  if (el) el.textContent = "Ingredient List & Tags";
  el = document.querySelector('[data-var="section3-subtitle"]');
  if (el) el.textContent = "Full ingredient list and tagged details for each formula.";

  el = document.querySelector('[data-var="brand-1-sec3-name"]');
  if (el) el.textContent = mainRow["data-one"] || "";
  el = document.querySelector('[data-var="section3-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildIngredientMadlib(mainRow));
    el.textContent = '';
  }
  el = document.querySelector('[data-var="brand-1-sec3-counts"]');
  if (el) el.innerHTML = buildCountsTable(mainRow, `${mainRow["data-brand"]} ${mainRow["data-one"]}`);
  el = document.querySelector('[data-var="section3-contentious-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildSection4Madlib(mainRow));
    el.textContent = '';
  }
  el = document.querySelector('[data-var="brand-1-sec3-previewimg"]');
  if (el && mainRow.previewengine) {
    el.style.setProperty("background-image", `url(${mainRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }
  el = document.querySelector('[data-var="brand-1-sec3-inglist"]');
  if (el) el.innerHTML = renderIngListDivs(mainRow);

  el = document.querySelector('[data-var="sport-1-sec3-name"]');
  if (el) el.textContent = sdfRow["data-one"] || "";
  el = document.querySelector('[data-var="section3-sport-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildIngredientMadlib(sdfRow));
    el.textContent = '';
  }
  el = document.querySelector('[data-var="sport-1-sec3-counts"]');
  if (el) el.innerHTML = buildCountsTable(sdfRow, `Sport Dog Food ${sdfRow["data-one"]}`);
  el = document.querySelector('[data-var="section3-sport-contentious-madlib"]');
  if (el) {
    el.setAttribute('data-text', buildSection4Madlib(sdfRow));
    el.textContent = '';
  }
  el = document.querySelector('[data-var="sport-1-sec3-previewimg"]');
  if (el && sdfRow.previewengine) {
    el.style.setProperty("background-image", `url(${sdfRow.previewengine})`);
    el.style.setProperty("background-size", "cover");
    el.style.setProperty("background-position", "center");
  }
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
          <div class="ci-ing-table-col">Total ingredients</div>
          <div class="ci-ing-table-col">${counts.total}</div>
        </div>
        <div class="ci-ing-table-row">
          <div class="ci-ing-table-col">Protein</div>
          <div class="ci-ing-table-col">${counts.Protein}</div>
        </div>
        <div class="ci-ing-table-row">
          <div class="ci-ing-table-col">Plants</div>
          <div class="ci-ing-table-col">${counts.Plants}</div>
        </div>
        <div class="ci-ing-table-row">
          <div class="ci-ing-table-col">Supplemental</div>
          <div class="ci-ing-table-col">${counts.Supplemental}</div>
        </div>
        ${
          counts.Other
            ? `<div class="ci-ing-table-row">
                <div class="ci-ing-table-col">Other</div>
                <div class="ci-ing-table-col">${counts.Other}</div>
               </div>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildIngredientMadlib(row) {
  const counts = getIngredientCategoryCounts(row);
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
        // 1) paint all of Section 3’s content
        paintSection3(mainRow, sdfRow);
        // 2) run Typed.js for each of its three madlibs
        runTypedForMadlib('section3-madlib');
        runTypedForMadlib('section3-sport-madlib');
        runTypedForMadlib('section3-sport-contentious-madlib');
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
          runTypedForMadlib('sectionk-madlib');
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
  const mainRow  = CI_DATA.find(row => row['data-five'] === mainFive);
  const sdfId    = getSdfFormula(mainRow);
  const sdfRow   = getCiRow(sdfId);

  if (!mainRow || !sdfRow) {
    console.error('[CCI] Unable to find required rows', { mainFive, mainRow, sdfRow });
    return;
  }

  window.CCI = { mainRow, sdfRow, ING_ANIM, ING_PLANT, ING_SUPP };

  lazyLoadCompareSections(mainRow, sdfRow);
}
