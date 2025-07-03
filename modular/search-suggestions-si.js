// search-suggestions-si.js changes

// --- Imports ---
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';

// ---- Trigger/Keyword banks ----
const generalTriggers = [
  "what", "is", "does", "does it", "show", "list", "give me"
];
const containsTriggers = [
  "contain", "with", "has", "include", "does", "does it contain", "has", "includes"
];
const notTriggers = [
  "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no"
];
const freeTriggers = [
  "free", "free of", "without", "minus", "no", "is it free", "is free of"
];
const vaTriggers = [
  "has", "with", "feature", "includes", "plus", "added", "value", "benefit"
];
const factTriggers = [
  "fact", "spec", "nutrition", "protein", "fat", "fiber", "moisture", "ash", "kcals", "calories", "per cup", "per kg", "omega", "%", "how many", "how much"
];
const weightTriggers = [
  "weight", "lb", "lbs", "kg", "pound", "how much", "feed", "for my", "dog is", "weighs"
];
const dogTriggers = [
  "for", "good for", "suitable", "activity", "active", "breed", "group", "job", "best for"
];

// ---- Helper functions ----
function allIngredientKeywords(ing) {
  // Normalizes all possible keyword triggers for ingredient lookups.
  const arr = [
    ing.displayAs.toLowerCase(),
    ...(ing.groupWith ? [ing.groupWith.toLowerCase()] : []),
    `with ${ing.displayAs.toLowerCase()}`,
    `has ${ing.displayAs.toLowerCase()}`,
    `contains ${ing.displayAs.toLowerCase()}`,
    `including ${ing.displayAs.toLowerCase()}`,
    ...(ing.tags || [])
  ];
  if (ing.groupWith) {
    arr.push(`with ${ing.groupWith.toLowerCase()}`);
    arr.push(`contains ${ing.groupWith.toLowerCase()}`);
  }
  return Array.from(new Set(arr));
}
function vaKeywords(va) {
  const base = va.displayAs ? va.displayAs.toLowerCase() : va.toLowerCase();
  return [
    base,
    base.replace(/ free$/, ""),
    `with ${base}`,
    `has ${base}`,
    `contains ${base}`,
    ...(va.tags || [])
  ];
}
function dogKeywords(dog) {
  const terms = [dog.displayAs.toLowerCase()];
  if (dog.group) terms.push(dog.group.toLowerCase());
  if (dog.job) terms.push(dog.job.toLowerCase());
  if (dog.activity) terms.push(dog.activity.toLowerCase());
  if (dog.activityLevel) terms.push(dog.activityLevel.toLowerCase());
  return Array.from(new Set(terms));
}
const FACTS = [
  { key: "ga_crude_protein_%",   label: "Protein",    unit: "%",       aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",       label: "Fat",        unit: "%",       aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_crude_fiber_%",     label: "Fiber",      unit: "%",       aliases: ["fiber", "crude fiber", "fiber %"] },
  { key: "ga_moisture_%",        label: "Moisture",   unit: "%",       aliases: ["moisture", "moisture %"] },
  { key: "ga_ash_%",             label: "Ash",        unit: "%",       aliases: ["ash", "ash %"] },
  { key: "ga_calcium_%",         label: "Calcium",    unit: "%",       aliases: ["calcium", "calcium %"] },
  { key: "ga_phosphorous_%",     label: "Phosphorus", unit: "%",       aliases: ["phosphorus", "phosphorous", "phosphorus %"] },
  { key: "ga_omega_6_fatty_acids_%", label: "Omega 6", unit: "%",      aliases: ["omega 6", "omega 6 fatty acids"] },
  { key: "ga_omega_3_fatty_acids_%", label: "Omega 3", unit: "%",      aliases: ["omega 3", "omega 3 fatty acids"] },
  { key: "ga_vitamin_d_3",       label: "Vitamin D3", unit: "IU/kg",   aliases: ["vitamin d", "vitamin d3"] },
  { key: "ga_vitamin_e",         label: "Vitamin E",  unit: "IU/kg",   aliases: ["vitamin e"] },
  { key: "ga_vitamin_b_12",      label: "Vitamin B12",unit: "IU/kg",   aliases: ["vitamin b12"] },
  { key: "ga_selenium",          label: "Selenium",   unit: "mg/kg",   aliases: ["selenium"] },
  { key: "ga_animal_protein_%",  label: "Animal Protein", unit: "%",   aliases: ["animal protein"] },
  { key: "specs_kcals_per_cup",  label: "kcals/cup",  unit: "kcals/cup",aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] },
  { key: "specs_kcals_per_kg",   label: "kcals/kg",   unit: "kcals/kg",aliases: ["kcals/kg", "kcals per kg"] }
];

// ---- Main SI Suggestion Builder ----
function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];

  // --- Free-of Pills (diet tags, e.g. legumes-free, poultry-free) ---
  ["data-legumes", "data-poultry", "data-grain", "data-peas"].forEach(key => {
    if (row[key] && row[key].toLowerCase().includes("free")) {
      const diet = row[key].replace(/[- ]*free/i, "").trim();
      if (diet) {
        s.push({
          type: "free-of",
          triggers: freeTriggers.concat([diet.toLowerCase(), `${diet} free`]),
          question: `${diet.charAt(0).toUpperCase() + diet.slice(1)} Free?`,
          keywords: [diet.toLowerCase(), `${diet} free`, "free"],
          answer: `Yes, ${diet.charAt(0).toUpperCase() + diet.slice(1)}-free.`
        });
      }
    }
  });

  // --- Ingredient Contains ---
  safeArray(row['ing-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-contains",
        triggers: containsTriggers.concat(allIngredientKeywords(ing)),
        question: `Contains ${ing.displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `Yes, contains ${ing.displayAs}.`
      });
  });

  // --- Ingredient NOT Contains ---
  safeArray(row['not-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-not-contains",
        triggers: notTriggers.concat(allIngredientKeywords(ing)),
        question: `No ${ing.displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `No, does not contain ${ing.displayAs}.`
      });
  });

  // --- Value Adds (VAs) ---
  safeArray(row['va-data-fives']).forEach(d5 => {
    const va = vaMap[d5] || { displayAs: d5 };
    s.push({
      type: "value-add",
      triggers: vaTriggers.concat(va.displayAs.toLowerCase()),
      question: `${va.displayAs}?`,
      keywords: vaKeywords(va),
      answer: `Yes, ${va.displayAs}.`
    });
  });

  // --- Facts: Always show as "Label (unit): value" ---
  FACTS.forEach(f => {
    if (row[f.key] !== undefined && row[f.key] !== null && String(row[f.key]).trim() !== "") {
      const val = row[f.key];
      s.push({
        type: "fact",
        triggers: factTriggers.concat(f.label.toLowerCase(), ...f.aliases),
        question: `${f.label} (${f.unit})?`,
        keywords: [f.label.toLowerCase(), ...f.aliases, f.unit],
        answer: `${f.label}: ${val} ${f.unit}`
      });
      s.push({
        type: "fact-how-many",
        triggers: ["how many", "how much", f.label.toLowerCase()].concat(f.aliases),
        question: `How much ${f.label.toLowerCase()}?`,
        keywords: [`how many ${f.label.toLowerCase()}`].concat(f.aliases),
        answer: `There are ${val} ${f.label.toLowerCase()}.`
      });
    }
  });

  // --- Dog-related: Breed, Activity, Group, Job ---
  safeArray(row['dogBr-fives']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-breed",
        triggers: dogTriggers.concat(dog.displayAs.toLowerCase(), ...(dog.tags||[])),
        question: `Good for ${dog.displayAs}?`,
        keywords: dogKeywords(dog),
        answer: `Good for ${dog.displayAs}.`
      });
  });
  safeArray(row['dogKeys_ac']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-activity",
        triggers: dogTriggers.concat(dog.displayAs.toLowerCase()),
        question: `For ${dog.displayAs}?`,
        keywords: dogKeywords(dog),
        answer: `Good for ${dog.displayAs}.`
      });
  });
  safeArray(row['dogKeys_gp']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-group",
        triggers: dogTriggers.concat(dog.displayAs.toLowerCase()),
        question: `${dog.displayAs} group?`,
        keywords: dogKeywords(dog),
        answer: `For ${dog.displayAs} group.`
      });
  });
  safeArray(row['dogKeys_jb']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-job",
        triggers: dogTriggers.concat(dog.displayAs.toLowerCase()),
        question: `${dog.displayAs} job?`,
        keywords: dogKeywords(dog),
        answer: `For ${dog.displayAs} job.`
      });
  });

  // --- Feeding/Weight ---
  safeArray(row['dogWeights'] || ["40 lbs", "50 lbs", "60 lbs", "70 lbs", "80 lbs"]).forEach(wt => {
    s.push({
      type: "weight",
      triggers: weightTriggers.concat(wt),
      question: `Feed ${wt}?`,
      keywords: [wt, `${wt} dog`, `feed ${wt}`],
      answer: `Ask about feeding for a dog at ${wt}.`
    });
  });

  return s;
}

// ---- Utility ----
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "string" && val.trim()) return [val];
  try { return Array.from(val); } catch { return []; }
}

// ---- Main Init Function (export) ----
export function initSearchSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  // --- Only show for SI pages (should be guarded in your markup)
  const five = document.getElementById('item-faq-five')?.value;
  const row  = SI_DATA.find(r => String(r['data-five']) === String(five));
  if (!row) return;
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  const vaMap  = VA_DATA;
  const dogMap = DOG_DATA;
  const suggestions = buildSiSuggestions(row, ingMap, vaMap, dogMap);

  // --- Fuse search, use triggers and keywords ---
  const fuse = new Fuse(suggestions, {
    keys: ['question', 'keywords', 'triggers'],
    threshold: 0.33,
    distance: 45
  });

  // --- Predefined starter pills (can customize or inject as needed) ---
  function renderStarter() {
    starter.innerHTML = '';
    // Show all "free-of" first, then ingredients, then facts, then feeding, then dog pills
    const cats = [
      'free-of', 'ingredient-contains', 'ingredient-not-contains', 'value-add', 'fact', 'weight', 'dog-breed', 'dog-activity', 'dog-group', 'dog-job'
    ];
    let pillOrder = [];
    cats.forEach(cat => {
      pillOrder = pillOrder.concat(suggestions.filter(s => s.type === cat));
    });
    pillOrder.slice(0,8).forEach(item => {
      const a = document.createElement('button');
      a.className = 'pwr-suggestion-pill';
      a.textContent = item.question;
      a.addEventListener('click', e => {
        e.preventDefault();
        input.value = item.question;
        list.style.display = 'none';
        showAnswer(item.answer);
      });
      starter.appendChild(a);
    });
    starter.style.display = 'flex';
  }

  function showAnswer(text) {
    answerTxt.textContent = '';
    answerBox.style.display = 'block';
    if (window.Typed) {
      new window.Typed(answerTxt, { strings: [text], typeSpeed: 18, showCursor: false });
    } else {
      answerTxt.textContent = text;
    }
    starter.style.display = 'none';
    list.style.display    = 'none';
  }
  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
  }

  // --- Live typeahead suggestions ---
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';
    // Show only the most relevant by intent/trigger/keyword
    const results = fuse.search(q).slice(0,8).map(r=>r.item);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
    } else {
      results.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', ()=>{
          input.value = item.question;
          showAnswer(item.answer);
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  input.addEventListener('keydown', e => { if (e.key==='Enter') {
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const found = fuse.search(q);
    if (found.length) showAnswer(found[0].item.answer || 'No answer set.');
    else showAnswer('No answer set.');
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  // --- Initial pills ---
  answerBox.style.display = 'none';
  renderStarter();
}
