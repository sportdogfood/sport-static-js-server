// search-suggestions-si.js

import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';

// --- Triggers ---
const generalTriggers = [
  "what", "what is", "is", "how", "how much", "how many", "does", "contain", "with", "has", "include", "show", "list"
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

// --- Helpers ---
function allIngredientKeywords(ing) {
  if (!ing) return [];
  const base = typeof ing.displayAs === "string" ? ing.displayAs.toLowerCase() : "";
  const plural = base.endsWith('s') ? base : (base ? base + 's' : "");
  const singular = base.endsWith('s') ? base.slice(0, -1) : base;
  const group = typeof ing.groupWith === "string" ? ing.groupWith.toLowerCase() : "";
  const tags = Array.isArray(ing.tags) ? ing.tags.map(String) : [];
  return Array.from(new Set([
    base,
    plural,
    singular,
    ...tags.map(t => t.toLowerCase()),
    group,
    `with ${base}`, `with ${plural}`, `with ${singular}`,
    `has ${base}`, `has ${plural}`, `has ${singular}`,
    `contains ${base}`, `contains ${plural}`, `contains ${singular}`,
    `including ${base}`, `including ${plural}`, `including ${singular}`,
    group ? `with ${group}` : "",
    group ? `contains ${group}` : "",
  ].filter(Boolean)));
}
function vaKeywords(va) {
  let base = (va && typeof va.displayAs === "string") ? va.displayAs.toLowerCase() : "";
  if (!base && typeof va === "string") base = va.toLowerCase();
  return Array.from(new Set([
    base,
    base.replace(/ free$/, ""),
    `with ${base}`,
    `has ${base}`,
    `contains ${base}`,
    ...(va && va.tags ? va.tags : [])
  ].filter(Boolean)));
}
function dogKeywords(dog) {
  if (!dog || typeof dog !== "object") return [];
  const out = [
    dog.displayAs, // exact
    dog.displayAs && dog.displayAs + "s",
    dog.displayAs && dog.displayAs.replace(/dog$/i, "").trim(), // remove trailing 'dog'
    dog.common_misspellings, dog.other_common_names, dog.common_initials, dog.common_nickname,
    dog.breed, dog.breeds, dog.type, dog.group, dog.job, dog.activity, dog.activityLevel,
    dog.group_suit, dog.job_suit, dog.activity_suit
  ];
  // Defensive: lower, remove undefined
  return Array.from(new Set(out.filter(Boolean).map(s => s.toLowerCase())));
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

// --- SUGGESTION BUILDER ---
function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];
  const dataOne = row['data-one'];

  // --- Ingredient Contains (deduped by displayAs) ---
  const containsSeen = new Set();
  safeArray(row['ing-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing || !ing.displayAs) return;
    const displayAs = ing.displayAs;
    if (!containsSeen.has(displayAs)) {
      containsSeen.add(displayAs);
      s.push({
        type: "ingredient-contains",
        triggers: allIngredientKeywords(ing),
        question: `${dataOne} contains ${displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `Yes, ${dataOne} contains ${displayAs}.`
      });
    }
  });

  // --- Ingredient Not-Contains (deduped by displayAs) ---
  const notSeen = new Set();
  safeArray(row['not-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing || !ing.displayAs) return;
    const displayAs = ing.displayAs;
    if (!notSeen.has(displayAs)) {
      notSeen.add(displayAs);
      s.push({
        type: "ingredient-not-contains",
        triggers: [...allIngredientKeywords(ing), ...notTriggers, ...freeTriggers],
        question: `${dataOne} does not contain ${displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `No, ${dataOne} does not contain ${displayAs}.`
      });
    }
  });

  // --- Free-Of (Legumes/Poultry/Grain) ---
  ["data-legumes","data-poultry","data-grain"].forEach(key => {
    if (row[key]) {
      const diet = row[key].replace(/ Free|-free|free/gi, '').trim();
      if (!diet) return;
      s.push({
        type: "free-of",
        triggers: [diet.toLowerCase(), ...freeTriggers, `${diet.toLowerCase()} free`],
        question: `${dataOne} is ${diet} Free?`,
        keywords: [diet.toLowerCase(), "free", `${diet.toLowerCase()} free`],
        answer: `Yes, ${dataOne} is free of ${diet}.`
      });
    }
  });

  // --- Value Adds ---
  safeArray(row['va-data-fives']).forEach(d5 => {
    const va = vaMap[d5];
    if (!va || !va.displayAs) return; // Only show value-adds present in map
    const displayAs = va.displayAs.trim();
    const triggers = Array.from(new Set([
      ...vaTriggers,
      displayAs.toLowerCase(),
      ...(va.triggers ? va.triggers.map(t => t.toLowerCase()) : [])
    ]));
    s.push({
      type: "value-add",
      triggers,
      question: `${dataOne} offers ${displayAs}?`,
      keywords: vaKeywords(va),
      answer: `Yes, ${dataOne} offers ${displayAs}.`
    });
  });

  // --- Facts (Percentages and Amounts) ---
  FACTS.forEach(f => {
    if (row[f.key] !== undefined && row[f.key] !== null && row[f.key] !== "") {
      const val = row[f.key];
      s.push({
        type: "fact",
        triggers: [f.label.toLowerCase(), ...f.aliases.map(a => a.toLowerCase())],
        question: `${dataOne} ${f.label}?`,
        keywords: [...f.aliases.map(a => a.toLowerCase()), f.label.toLowerCase()],
        answer: `${dataOne} ${f.label} is ${val}`
      });
    }
  });

  // --- DOG/BREED/JOB/GROUP/ACTIVITY ---
  const dogSeen = new Set();

  safeArray(row['dogBr-fives']).forEach(d5 => {
    const dog = dogMap[d5];
    if (dog && typeof dog.displayAs === "string" && !dogSeen.has(dog.displayAs)) {
      dogSeen.add(dog.displayAs);
      const dogAliases = dogKeywords(dog);
      s.push({
        type: "dog-breed",
        triggers: [
          ...dogAliases, "breed", "dog", "for", "good for", "recommended"
        ],
        question: `${dataOne} for ${dog.displayAs}?`,
        keywords: dogAliases,
        answer: `${dataOne} is recommended for ${dog.displayAs}.`
      });
    }
  });

  // Activities, Jobs, Groups
  const tagVariants = [
    { key: 'activity-suit', type: 'dog-activity', label: 'activity' },
    { key: 'group-suit',    type: 'dog-group',    label: 'group' },
    { key: 'job-suit',      type: 'dog-job',      label: 'job' }
  ];
  tagVariants.forEach(({key, type, label}) => {
    if (row[key]) {
      row[key].split(",").map(x=>x.trim()).filter(Boolean).forEach(tag => {
        const tagKey = `${type}:${tag}`;
        if (!dogSeen.has(tagKey)) {
          dogSeen.add(tagKey);
          s.push({
            type,
            triggers: [tag.toLowerCase(), label, "for", "good for", "recommended"],
            question: `${dataOne} for ${tag}?`,
            keywords: [tag.toLowerCase()],
            answer: `${dataOne} is recommended for ${tag}.`
          });
        }
      });
    }
  });

  // Activity level (as a quick suggestion)
  if (typeof row["activity-level"] === "string" && row["activity-level"].trim()) {
    const activityLevel = row["activity-level"].toLowerCase();
    s.push({
      type: "dog-activity-level",
      triggers: [activityLevel, "activity level", "level", "energy", "active", "for"],
      question: `${dataOne} for ${row["activity-level"]} dogs?`,
      keywords: [activityLevel],
      answer: `${dataOne} is best for ${row["activity-level"]} dogs.`
    });
  }

  // Default breed as fallback (Active Adult, 60 lbs)
  if (!row['dogBr-fives'] || !row['dogBr-fives'].length) {
    s.push({
      type: "dog-default",
      triggers: ["active adult", "breed", "dog", "active", "adult", "default", "60 lbs", "average"],
      question: `${dataOne} for Active Adult (60 lbs)?`,
      keywords: ["active adult", "60 lbs", "average", "default"],
      answer: `${dataOne} is recommended for an active adult dog (60 lbs).`
    });
  }

  return s;
}

// --- MAIN INIT ---
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

  // --- Starter pills: Show first 2 per category only (edit as needed)
  function renderStarter() {
    starter.innerHTML = '';
    const pillTypes = [
      "ingredient-contains", "ingredient-not-contains",
      "free-of", "value-add", "fact", "dog-breed"
    ];
    pillTypes.forEach(type => {
      suggestions
        .filter(item => item.type === type)
        .slice(0, 2)
        .forEach(item => {
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

  // --- Live typeahead suggestions with advanced filtering
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';

    // Intent detection
    const isNegative = notTriggers.some(tr => q.includes(tr)) || freeTriggers.some(tr => q.includes(tr));
    const isFact = /^what is|how much|how many/.test(q);
    const isDog = /dog|breed|for|good for|recommended/.test(q);

    let results = fuse.search(q).slice(0, 10).map(r => r.item);

    // Strict result type filtering based on intent
    results = results.filter(item => {
      if (item.type === "fact") return isFact;
      if (item.type === "ingredient-not-contains") return isNegative || (q.split(' ').some(word => item.keywords.includes(word)));
      if (item.type === "ingredient-contains") return !isNegative;
      if (item.type === "free-of") return q.includes("free");
      if (item.type === "dog-breed" || item.type === "dog-group" || item.type === "dog-activity" || item.type === "dog-job" || item.type === "dog-activity-level" || item.type === "dog-default") return isDog || q.split(' ').some(word => item.keywords.includes(word));
      if (item.type === "value-add") return vaTriggers.some(tr => q.includes(tr)) || item.keywords.some(k => q.includes(k));
      return true;
    });

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
        li.addEventListener('click', () => {
          input.value = item.question;
          showAnswer(item.answer);
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') {
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const isNegative = notTriggers.some(tr => q.includes(tr)) || freeTriggers.some(tr => q.includes(tr));
    const isFact = /^what is|how much|how many/.test(q);
    const isDog = /dog|breed|for|good for|recommended/.test(q);

    let found = fuse.search(q);

    found = found.filter(r => {
      const item = r.item;
      if (item.type === "fact") return isFact;
      if (item.type === "ingredient-not-contains") return isNegative || (q.split(' ').some(word => item.keywords.includes(word)));
      if (item.type === "ingredient-contains") return !isNegative;
      if (item.type === "free-of") return q.includes("free");
      if (item.type === "dog-breed" || item.type === "dog-group" || item.type === "dog-activity" || item.type === "dog-job" || item.type === "dog-activity-level" || item.type === "dog-default") return isDog || q.split(' ').some(word => item.keywords.includes(word));
      if (item.type === "value-add") return vaTriggers.some(tr => q.includes(tr)) || item.keywords.some(k => q.includes(k));
      return true;
    });

    if (found.length) showAnswer(found[0].item.answer || 'No answer set.');
    else showAnswer('No answer set.');
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
}
