import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';
import { VA_AGNOSTIC } from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';


console.log("[SI] Module loaded. SI_DATA, ING_ANIM, ING_PLANT, ING_SUPP, VA_DATA, DOG_DATA imported.");

const notTriggers = [ "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no", "not" ];
const freeTriggers = [ "free", "free of", "without", "minus", "no" ];
const vaTriggers = [ "has", "with", "feature", "includes", "plus", "added", "value", "benefit" ];

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

const FACT_ALIASES = [];
FACTS.forEach(f => FACT_ALIASES.push(...f.aliases.map(a => a.toLowerCase()), f.label.toLowerCase()));

function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "string" && val.trim()) return [val];
  try { return Array.from(val); } catch { return []; }
}
function expandWords(str) {
  if (!str) return [];
  return str.split(/,|\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(Boolean)
    .flatMap(w => w.endsWith('s') ? [w, w.slice(0, -1)] : [w]);
}
function allIngredientKeywords(ing) {
  if (!ing) return [];
  const base = typeof ing.displayAs === "string" ? ing.displayAs.toLowerCase() : "";
  const plural = base.endsWith('s') ? base : (base ? base + 's' : "");
  const singular = base.endsWith('s') ? base.slice(0, -1) : base;
  const group = typeof ing.groupWith === "string" ? ing.groupWith.toLowerCase() : "";
  const tags = Array.isArray(ing.tags) ? ing.tags.map(String) : [];
  return Array.from(new Set([
    base, plural, singular,
    ...tags.map(t => t.toLowerCase()),
    group,
    ...expandWords(base),
    `with ${base}`, `with ${plural}`, `with ${singular}`,
    `has ${base}`, `has ${plural}`, `has ${singular}`,
    `contains ${base}`, `contains ${plural}`, `contains ${singular}`,
    `including ${base}`, `including ${plural}`, `including ${singular}`,
    group ? `with ${group}` : "",
    group ? `contains ${group}` : "",
  ].filter(Boolean)));
}
function vaKeywords(va) {
  let words = [];
  if (va['data-one']) words.push(va['data-one'].toLowerCase());
  if (va['data-keys']) {
    words = words.concat(
      va['data-keys'].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    );
  }
  return Array.from(new Set(words));
}
function dogKeywords(dog) {
  let fields = [
    dog['data-one'], dog.Name,
    ...(dog['common_misspellings'] ? dog['common_misspellings'].split(',').map(s=>s.trim()) : []),
    ...(dog['other_common_names'] ? dog['other_common_names'].split(',').map(s=>s.trim()) : []),
    ...(dog['common_initials'] ? dog['common_initials'].split(',').map(s=>s.trim()) : []),
    ...(dog['common_nickname'] ? dog['common_nickname'].split(',').map(s=>s.trim()) : []),
    ...(dog['group-suit'] ? dog['group-suit'].split(',').map(s=>s.trim()) : []),
    ...(dog['activity-suit'] ? dog['activity-suit'].split(',').map(s=>s.trim()) : []),
    ...(dog['job-suit'] ? dog['job-suit'].split(',').map(s=>s.trim()) : []),
    dog['activity-level']
  ];
  return Array.from(new Set(fields.filter(Boolean).map(s => s.toLowerCase())));
}

// --- AGNOSTIC SUGGESTIONS ---

  // (1) VA AGNOSTIC SUGGESTIONS (Best calorie-dense kibble? etc)
  if (Array.isArray(VA_AGNOSTIC)) {
    VA_AGNOSTIC.forEach(va => {
      if (
        typeof va === "object" &&
        va &&
        typeof va.tag === "string" &&
        va.tag.trim() &&
        Array.isArray(va.ids) &&
        va.ids.length
      ) {
        const tagStr = va.tag.trim();
        s.push({
          type: "va-agnostic",
          triggers: Array.isArray(va.triggers) ? va.triggers : [tagStr.toLowerCase()],
          question: `Best ${tagStr.replace(/-/g, ' ')} kibble?`,
          keywords: Array.isArray(va.triggers) ? va.triggers : [tagStr.toLowerCase()],
          answer: `Try formulas: ${va.ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            return row ? (row['data-one'] || row.Name || id) : id;
          }).join(", ")}`,
          description: typeof va.description === "string" ? va.description : ""
        });
      }
    });
  }

  // (2) DOG/BREED AGNOSTIC SUGGESTIONS (Best kibble for Rottweilers? etc)
  if (Array.isArray(DOG_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (
        typeof dog === "object" &&
        dog &&
        typeof dog.tag === "string" &&
        dog.tag.trim() &&
        Array.isArray(dog.ids) &&
        dog.ids.length
      ) {
        const tagStr = dog.tag.trim();
        s.push({
          type: "dog-agnostic",
          triggers: [tagStr.toLowerCase()],
          question: `Best kibble for ${tagStr}?`,
          keywords: [tagStr.toLowerCase()],
          answer: `Recommended formulas for ${tagStr}: ${dog.ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            return row ? (row['data-one'] || row.Name || id) : id;
          }).join(", ")}`,
          description: typeof dog.description === "string" ? dog.description : ""
        });
      }
    });
  }

  // (3) VA+DOG AGNOSTIC SUGGESTIONS (Best calorie-dense kibble for Rottweilers? etc)
  if (Array.isArray(DOG_AGNOSTIC) && Array.isArray(VA_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (
        typeof dog === "object" &&
        dog &&
        typeof dog.tag === "string" &&
        dog.tag.trim() &&
        Array.isArray(dog.ids) &&
        dog.ids.length
      ) {
        const dogTagStr = dog.tag.trim();
        VA_AGNOSTIC.forEach(va => {
          if (
            typeof va === "object" &&
            va &&
            typeof va.tag === "string" &&
            va.tag.trim() &&
            Array.isArray(va.ids) &&
            va.ids.length
          ) {
            const vaTagStr = va.tag.trim();
            const matches = va.ids.filter(id => dog.ids.includes(id));
            if (matches.length) {
              s.push({
                type: "va-dog-agnostic",
                triggers: [vaTagStr.toLowerCase(), dogTagStr.toLowerCase()],
                question: `Best ${vaTagStr.replace(/-/g, ' ')} kibble for ${dogTagStr}?`,
                keywords: [vaTagStr.toLowerCase(), dogTagStr.toLowerCase()],
                answer: `Recommended ${vaTagStr.replace(/-/g, ' ')} formulas for ${dogTagStr}: ${matches.map(id => {
                  const row = SI_DATA.find(r => String(r['data-five']) === String(id));
                  return row ? (row['data-one'] || row.Name || id) : id;
                }).join(", ")}`,
                description:
                  (typeof va.description === "string" ? va.description : "") +
                  (typeof dog.description === "string" && dog.description ? " for " + dogTagStr : "")
              });
            }
          }
        });
      }
    });
  }

  return s;
}


// -------------------- UI LOGIC (unchanged) --------------------
export function initSearchSuggestions() {
  console.log("[SI] initSearchSuggestions called!");
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) {
    console.log("[SI] One or more input elements missing!");
    return;
  }
  console.log("[SI] DOM elements found!");

  const five = document.getElementById('item-faq-five')?.value;
  console.log("[SI] Loaded five:", five);
  const row  = SI_DATA.find(r => String(r['data-five']) === String(five));
  if (!row) {
    console.log("[SI] No matching row found in SI_DATA for data-five:", five);
    return;
  }
  console.log("[SI] SI row found:", row);

  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  const vaMap  = VA_DATA;
  const dogMap = DOG_DATA;
  const suggestions = buildSiSuggestions(row, ingMap, vaMap, dogMap);

  console.log("[SI] Suggestions built:", suggestions.length);

  function renderStarter() {
    starter.innerHTML = '';
    suggestions.slice(0, 6).forEach(item => {
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

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';

    const queryWords = q.split(/\s+/).filter(Boolean);
    function matchItem(item) {
      const fields = [...(item.triggers||[]), ...(item.keywords||[])];
      return queryWords.every(word =>
        fields.some(field => field === word || field.startsWith(word) || field.includes(word))
      );
    }

    let results = suggestions.filter(matchItem);

    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
    } else {
      results.slice(0, 7).forEach(item => {
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

    const queryWords = q.split(/\s+/).filter(Boolean);
    function matchItem(item) {
      const fields = [...(item.triggers||[]), ...(item.keywords||[])];
      return queryWords.every(word =>
        fields.some(field => field === word || field.startsWith(word) || field.includes(word))
      );
    }
    let found = suggestions.filter(matchItem);

    if (found.length) showAnswer(found[0].answer || 'No answer set.');
    else showAnswer('No answer set.');
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
  console.log("[SI] initSearchSuggestions finished.");
}
