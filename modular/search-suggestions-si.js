// search-suggestions-si.js

// --- Imports ---
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';

// ---- Core Trigger/Keyword Helpers ----
const generalTriggers = [
  "what", "is", "how", "how much", "how many", "does", "contain", "with", "has", "include", "show", "list"
];
const notTriggers = [
  "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no"
];
const freeTriggers = [
  "free", "free of", "without", "minus", "no"
];
const vaTriggers = [
  "has", "with", "feature", "includes", "plus", "added", "value", "benefit"
];
const weightTriggers = [
  "weight", "lb", "lbs", "kg", "pound", "how much", "feed", "for my", "dog is", "weighs"
];

// ---- Ingredient Helpers ----
function allIngredientKeywords(ing) {
  // `ing` is an object with displayAs, groupWith, tags, etc.
  const terms = [
    ing.displayAs.toLowerCase(),
    (ing.groupWith || "").toLowerCase()
  ];
  // Add basic alt-phrases
  const base = ing.displayAs.toLowerCase();
  return [
    base,
    `with ${base}`,
    `has ${base}`,
    `contains ${base}`,
    `${base} included`,
    `including ${base}`,
    ing.groupWith ? `with ${ing.groupWith.toLowerCase()}` : null,
    ing.groupWith ? `contains ${ing.groupWith.toLowerCase()}` : null,
    ...(ing.tags || [])
  ].filter(Boolean);
}

// ---- Value Add Helpers ----
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

// ---- Dog/Breed Helpers ----
function dogKeywords(dog) {
  // Allow for breed, group, job, activity, activity-level
  const terms = [dog.displayAs.toLowerCase()];
  if (dog.group) terms.push(dog.group.toLowerCase());
  if (dog.job) terms.push(dog.job.toLowerCase());
  if (dog.activity) terms.push(dog.activity.toLowerCase());
  if (dog.activityLevel) terms.push(dog.activityLevel.toLowerCase());
  return Array.from(new Set(terms));
}

// ---- Fact Helpers ----
const FACTS = [
  { key: "ga_crude_protein_%", label: "protein", aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",     label: "fat",     aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_crude_fiber_%",   label: "fiber",   aliases: ["fiber", "crude fiber", "fiber %"] },
  { key: "ga_moisture_%",      label: "moisture",aliases: ["moisture", "moisture %"] },
  { key: "ga_ash_%",           label: "ash",     aliases: ["ash", "ash %"] },
  { key: "ga_calcium_%",       label: "calcium", aliases: ["calcium", "calcium %"] },
  { key: "ga_phosphorous_%",   label: "phosphorus", aliases: ["phosphorus", "phosphorous", "phosphorus %"] },
  { key: "ga_omega_6_fatty_acids_%", label: "omega 6", aliases: ["omega 6", "omega 6 fatty acids"] },
  { key: "ga_omega_3_fatty_acids_%", label: "omega 3", aliases: ["omega 3", "omega 3 fatty acids"] },
  { key: "ga_vitamin_d_3",     label: "vitamin d3", aliases: ["vitamin d", "vitamin d3"] },
  { key: "ga_vitamin_e",       label: "vitamin e", aliases: ["vitamin e"] },
  { key: "ga_vitamin_b_12",    label: "vitamin b12", aliases: ["vitamin b12"] },
  { key: "ga_selenium",        label: "selenium", aliases: ["selenium"] },
  { key: "ga_animal_protein_%",label: "animal protein", aliases: ["animal protein"] },
  { key: "specs_kcals_per_cup", label: "kcals per cup", aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] },
  { key: "specs_kcals_per_kg",  label: "kcals per kg", aliases: ["kcals/kg", "kcals per kg"] }
];

// ---- Main Suggestion Builder ----
function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];

  // --- Ingredient Contains
  (row['ing-data-fives'] || []).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-contains",
        triggers: [...generalTriggers, ...allIngredientKeywords(ing)],
        question: `Contains ${ing.displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `Yes, contains ${ing.displayAs}.`
      });
  });

  // --- Ingredient Not-Contains
  (row['not-data-fives'] || []).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-not-contains",
        triggers: [...notTriggers, ...allIngredientKeywords(ing)],
        question: `No ${ing.displayAs}?`,
        keywords: [ ...allIngredientKeywords(ing), ...(ing.groupWith ? [ing.groupWith.toLowerCase()] : []) ],
        answer: `No, does not contain ${ing.displayAs}.`
      });
  });

  // --- Value Adds
  (row['va-data-fives'] || []).forEach(d5 => {
    const va = vaMap[d5] || { displayAs: d5 }; // fallback for string VAs
    s.push({
      type: "value-add",
      triggers: [...vaTriggers, va.displayAs.toLowerCase()],
      question: `${va.displayAs}?`,
      keywords: vaKeywords(va),
      answer: `Yes, ${va.displayAs}.`
    });
  });

  // --- Free-Of Diets
  ["data-legumes","data-poultry","data-grain"].forEach(key => {
    if (row[key]) {
      const diet = row[key].replace(' Free', '').replace('-free', '').replace('free','').trim();
      s.push({
        type: "free-of",
        triggers: [...freeTriggers, diet],
        question: `Free of ${diet}?`,
        keywords: [diet, "free", `${diet} free`],
        answer: `Yes, free of ${diet}.`
      });
    }
  });

  // --- Facts (Percentages and Amounts)
  FACTS.forEach(f => {
    if (row[f.key] !== undefined && row[f.key] !== null) {
      const val = row[f.key];
      s.push({
        type: "fact",
        triggers: [f.label, ...f.aliases, ...generalTriggers],
        question: `${f.label.charAt(0).toUpperCase() + f.label.slice(1)}?`,
        keywords: [...f.aliases],
        answer: `${f.label.charAt(0).toUpperCase() + f.label.slice(1)}: ${val}`
      });
      s.push({
        type: "fact-how-many",
        triggers: [`how many ${f.label}`, ...generalTriggers],
        question: `How many ${f.label}?`,
        keywords: [`how many ${f.label}`, ...f.aliases],
        answer: `There are ${val} ${f.label}.`
      });
    }
  });

  // --- Dog/Breed/Job/Activity
  (row['dogBr-fives'] || []).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-breed",
        triggers: [dog.displayAs.toLowerCase(), ...(dog.tags||[]), "for", "suitable", "breed"],
        question: `${dog.displayAs}?`,
        keywords: dogKeywords(dog),
        answer: `Good for ${dog.displayAs}.`
      });
  });
  (row['dogKeys_ac'] || []).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-activity",
        triggers: [dog.displayAs.toLowerCase(), "activity", "active", "for", "good for"],
        question: `For ${dog.displayAs}?`,
        keywords: dogKeywords(dog),
        answer: `Good for ${dog.displayAs}.`
      });
  });
  (row['dogKeys_gp'] || []).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-group",
        triggers: [dog.displayAs.toLowerCase(), "group", "for"],
        question: `${dog.displayAs} group?`,
        keywords: dogKeywords(dog),
        answer: `For ${dog.displayAs} group.`
      });
  });
  (row['dogKeys_jb'] || []).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-job",
        triggers: [dog.displayAs.toLowerCase(), "job", "for"],
        question: `${dog.displayAs} job?`,
        keywords: dogKeywords(dog),
        answer: `For ${dog.displayAs} job.`
      });
  });

  // --- Weight/Feeding
  (row['dogWeights'] || ["40 lbs","50 lbs","60 lbs","70 lbs","80 lbs"]).forEach(wt => {
    s.push({
      type: "weight",
      triggers: [...weightTriggers, wt],
      question: `Feed ${wt}?`,
      keywords: [wt, `${wt} dog`, `feed ${wt}`],
      answer: `Ask about feeding for a dog at ${wt}.`
    });
  });

  return s;
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

  // --- Fuse search for live trigger/keyword
  const fuse = new Fuse(suggestions, {
    keys: ['question','keywords','triggers'],
    threshold: 0.38,
    distance: 60
  });

  // --- Starter pills (5 random)
  function renderStarter() {
    starter.innerHTML = '';
    suggestions
      .map(item=>({ item, r:Math.random() }))
      .sort((a,b)=>a.r-b.r)
      .slice(0,5)
      .map(x=>x.item)
      .forEach(item=>{
        const a = document.createElement('button');
        a.className = 'pwr-suggestion-pill';
        a.textContent = item.question;
        a.addEventListener('click', e=>{
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

  // --- Live typeahead suggestions
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';
    const results = fuse.search(q).slice(0,7).map(r=>r.item);
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

  // --- Initial pills
  answerBox.style.display = 'none';
  renderStarter();
}

