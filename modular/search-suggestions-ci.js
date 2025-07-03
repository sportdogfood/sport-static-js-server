// search-suggestions-ci.js

import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA }    from './ci.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

// ---- Core Triggers ----
const generalTriggers = ["what", "is", "how", "does", "contain", "with", "has", "include", "show"];
const freeTriggers    = ["free", "free of", "without", "minus", "no"];

// ---- Ingredient Helper ----
function allIngredientKeywords(ing) {
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

// ---- Fact Definitions ----
const FACTS = [
  { key: "ga_crude_protein_%",   label: "protein",         aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",       label: "fat",             aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_crude_fiber_%",     label: "fiber",           aliases: ["fiber", "crude fiber", "fiber %"] },
  { key: "ga_moisture_%",        label: "moisture",        aliases: ["moisture", "moisture %"] },
  { key: "ga_ash_%",             label: "ash",             aliases: ["ash", "ash %"] },
  { key: "ga_calcium_%",         label: "calcium",         aliases: ["calcium", "calcium %"] },
  { key: "ga_omega_6_fatty_acids_%", label: "omega 6",     aliases: ["omega 6", "omega 6 fatty acids"] },
  { key: "ga_omega_3_fatty_acids_%", label: "omega 3",     aliases: ["omega 3", "omega 3 fatty acids"] },
  { key: "ga_vitamin_d_3",       label: "vitamin d3",      aliases: ["vitamin d", "vitamin d3"] },
  { key: "ga_vitamin_e",         label: "vitamin e",       aliases: ["vitamin e"] },
  { key: "ga_vitamin_b_12",      label: "vitamin b12",     aliases: ["vitamin b12"] },
  { key: "specs_kcals_per_cup",  label: "kcals per cup",   aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] },
  { key: "specs_kcals_per_kg",   label: "kcals per kg",    aliases: ["kcals/kg", "kcals per kg"] }
];

// ---- Main Suggestion Builder ----
function buildCiSuggestions(row, ingMap) {
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

  // --- Free-Of Diets (e.g., Grain-Free, Legumes-Free, Poultry-Free)
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
    }
  });

  return s;
}

// ---- Main Init Function ----
export function initSearchSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  // --- Only show for CI pages (should be guarded in your markup)
  const five = document.getElementById('item-faq-five')?.value;
  const row  = CI_DATA.find(r => String(r['data-five']) === String(five));
  if (!row) return;
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  const suggestions = buildCiSuggestions(row, ingMap);

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
