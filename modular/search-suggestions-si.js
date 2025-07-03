// search-suggestions-si.js

import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';

const generalTriggers = [
  "what", "is", "how", "how much", "how many", "does", "contain", "with", "has", "include", "show", "list"
];
const notTriggers = [
  "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no", "not"
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

function allIngredientKeywords(ing) {
  const base = (ing.displayAs || "").toLowerCase();
  const group = (ing.groupWith || "").toLowerCase();
  return [
    base,
    `with ${base}`,
    `has ${base}`,
    `contains ${base}`,
    `including ${base}`,
    group,
    `with ${group}`,
    `contains ${group}`,
    ...(ing.tags || [])
  ].filter(Boolean);
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
  { key: "ga_crude_protein_%", label: "Protein (%)", aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",     label: "Fat (%)",     aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_crude_fiber_%",   label: "Fiber (%)",   aliases: ["fiber", "crude fiber", "fiber %"] },
  { key: "ga_moisture_%",      label: "Moisture (%)",aliases: ["moisture", "moisture %"] },
  { key: "ga_ash_%",           label: "Ash (%)",     aliases: ["ash", "ash %"] },
  { key: "ga_calcium_%",       label: "Calcium (%)", aliases: ["calcium", "calcium %"] },
  { key: "ga_phosphorous_%",   label: "Phosphorus (%)", aliases: ["phosphorus", "phosphorous", "phosphorus %"] },
  { key: "ga_omega_6_fatty_acids_%", label: "Omega 6 (%)", aliases: ["omega 6", "omega 6 fatty acids"] },
  { key: "ga_omega_3_fatty_acids_%", label: "Omega 3 (%)", aliases: ["omega 3", "omega 3 fatty acids"] },
  { key: "ga_vitamin_d3_ui_per_kg",     label: "Vitamin D3", aliases: ["vitamin d", "vitamin d3"] },
  { key: "ga_vitamin_e_ui_per_kg",       label: "Vitamin E", aliases: ["vitamin e"] },
  { key: "ga_vitamin_b12_ui_per_kg",    label: "Vitamin B12", aliases: ["vitamin b12"] },
  { key: "ga_selenium",        label: "Selenium", aliases: ["selenium"] },
  { key: "ga_animal_protein_%",label: "Animal Protein (%)", aliases: ["animal protein"] },
  { key: "ga_kcals_per_cup", label: "kcals per cup", aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] },
  { key: "ga_kcals_per_kg",  label: "kcals per kg", aliases: ["kcals/kg", "kcals per kg"] }
];

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "string" && val.trim()) return [val];
  try { return Array.from(val); } catch { return []; }
}

function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];

  // --- Ingredient Contains
  safeArray(row['ing-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-contains",
        triggers: ["contain", "with", "has", "ingredient", "include", ...allIngredientKeywords(ing)],
        question: `Contains ${ing.displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `Yes, contains ${ing.displayAs}.`
      });
  });
  // --- Ingredient Not-Contains
  safeArray(row['not-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (ing)
      s.push({
        type: "ingredient-not-contains",
        triggers: ["not", ...notTriggers, ...allIngredientKeywords(ing)],
        question: `Does not contain ${ing.displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `No, does not contain ${ing.displayAs}.`
      });
  });
  // --- Free-Of
  ["data-legumes","data-poultry","data-grain"].forEach(key => {
    if (row[key]) {
      const diet = row[key].replace(' Free', '').replace('-free', '').replace('free','').trim();
      s.push({
        type: "free-of",
        triggers: ["free", ...freeTriggers, diet.toLowerCase()],
        question: `${diet} Free?`,
        keywords: [diet.toLowerCase(), "free", `${diet.toLowerCase()} free`],
        answer: `Yes, free of ${diet}.`
      });
    }
  });
  // --- Value Adds
  safeArray(row['va-data-fives']).forEach(d5 => {
    const va = vaMap[d5] || { displayAs: d5 };
    s.push({
      type: "value-add",
      triggers: ["value-add", ...vaTriggers, va.displayAs.toLowerCase()],
      question: `${va.displayAs}?`,
      keywords: vaKeywords(va),
      answer: `Yes, ${va.displayAs}.`
    });
  });
  // --- Facts (Percentages and Amounts)
  FACTS.forEach(f => {
    if (row[f.key] !== undefined && row[f.key] !== null && row[f.key] !== "") {
      const val = row[f.key];
      s.push({
        type: "fact",
        triggers: [f.label.toLowerCase(), ...f.aliases, ...generalTriggers],
        question: `${f.label}`,
        keywords: [...f.aliases, f.label.toLowerCase()],
        answer: `${f.label}: ${val}`
      });
    }
  });
  // --- Dog/Breed/Job/Activity
  safeArray(row['dogBr-fives']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog)
      s.push({
        type: "dog-breed",
        triggers: ["breed", dog.displayAs.toLowerCase(), ...(dog.tags||[])],
        question: `${dog.displayAs} breed?`,
        keywords: dogKeywords(dog),
        answer: `Good for ${dog.displayAs}.`
      });
  });

  safeArray(row['dogKeys_ac']).join(",").split(",").map(x=>x.trim()).filter(Boolean).forEach(act => {
    s.push({
      type: "dog-activity",
      triggers: ["activity", "active", "good for", act.toLowerCase()],
      question: `Good for ${act}?`,
      keywords: [act.toLowerCase()],
      answer: `Good for ${act}.`
    });
  });
  safeArray(row['dogKeys_gp']).join(",").split(",").map(x=>x.trim()).filter(Boolean).forEach(gp => {
    s.push({
      type: "dog-group",
      triggers: ["group", "for", gp.toLowerCase()],
      question: `Good for group: ${gp}?`,
      keywords: [gp.toLowerCase()],
      answer: `For ${gp} group.`
    });
  });
  safeArray(row['dogKeys_jb']).join(",").split(",").map(x=>x.trim()).filter(Boolean).forEach(jb => {
    s.push({
      type: "dog-job",
      triggers: ["job", "for", jb.toLowerCase()],
      question: `Good for job: ${jb}?`,
      keywords: [jb.toLowerCase()],
      answer: `For ${jb} job.`
    });
  });

  // --- Weight/Feeding (optional, comment out if not needed)
  // safeArray(row['dogWeights'] || []).forEach(wt => {
  //   s.push({
  //     type: "weight",
  //     triggers: [...weightTriggers, wt],
  //     question: `Feed ${wt}?`,
  //     keywords: [wt, `${wt} dog`, `feed ${wt}`],
  //     answer: `Ask about feeding for a dog at ${wt}.`
  //   });
  // });

  return s;
}

export function initSearchSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  // --- Only show for SI pages
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
    threshold: 0.36,
    distance: 60
  });

  // --- Show ONLY relevant (not random) pills
  function renderStarter() {
    starter.innerHTML = '';
    // Show all contains/not/free/fact pills in order
    const pillTypes = ["ingredient-contains", "ingredient-not-contains", "free-of", "value-add", "fact"];
    suggestions
      .filter(item=>pillTypes.includes(item.type))
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
    const results = fuse.search(q).slice(0,10).map(r=>r.item);
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
