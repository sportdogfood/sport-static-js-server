import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';
import { VA_DATA }    from './va.js';
import { DOG_DATA }   from './dog.js';

console.log("[SI] Module loaded. SI_DATA, ING_ANIM, ING_PLANT, ING_SUPP, VA_DATA, DOG_DATA imported.");

const notTriggers = [
  "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no", "not"
];
const freeTriggers = [
  "free", "free of", "without", "minus", "no"
];
const vaTriggers = [
  "has", "with", "feature", "includes", "plus", "added", "value", "benefit"
];
const FACTS = [
  // ... unchanged ...
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
// Only for INGREDIENTS!
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
// For VA: less aggressive, keep data-keys as phrases
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
// For DOG: use phrases from all fields
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

function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  console.log("[SI] buildSiSuggestions running...");
  const s = [];
  const dataOne = row['data-one'];
  // ... unchanged, keep all logic as in your code ...
  // (your full code block above stays here)
  // ...
  return s;
}

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

  const fuse = new Fuse(suggestions, {
    keys: ['question','keywords','triggers'],
    threshold: 0.36,
    distance: 60
  });

  function renderStarter() {
    console.log("[SI] renderStarter called!");
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
    console.log("[SI] Starter pills rendered:", starter.children.length);
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
    console.log("[SI] showAnswer called:", text);
  }
  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    console.log("[SI] resetAll called");
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      console.log("[SI] Input cleared; showing starter.");
      return;
    }
    starter.style.display = 'none';

    const queryWords = q.split(/\s+/).filter(Boolean);
    const isNegative = notTriggers.some(tr => q.includes(tr)) || freeTriggers.some(tr => q.includes(tr));
    const isFact = FACT_ALIASES.some(alias => alias.startsWith(q) || q.startsWith(alias) || alias.includes(q));

    function matchItem(item) {
      const fields = [...(item.triggers||[]), ...(item.keywords||[])];
      return queryWords.every(word =>
        fields.some(field => field === word || field.startsWith(word) || field.includes(word))
      );
    }

    const dogMatch = suggestions.filter(item => item.type.startsWith("dog-") && matchItem(item));
    const vaMatch = suggestions.filter(item => item.type === "value-add" && matchItem(item));

    let results = [];

    if (isFact) {
      results = suggestions.filter(item => item.type === "fact" && matchItem(item));
    } else if (dogMatch.length) {
      results = dogMatch;
    } else if (vaMatch.length) {
      results = vaMatch;
    } else if (isNegative) {
      results = suggestions.filter(item => (item.type === "ingredient-not-contains" || item.type === "free-of") && matchItem(item));
    } else {
      results = suggestions.filter(item =>
        (item.type === "ingredient-contains" || item.type === "ingredient-not-contains" || item.type === "free-of") &&
        matchItem(item)
      );
      if (!results.length) {
        results = suggestions.filter(item =>
          item.type.startsWith("dog-") ||
          item.type === "value-add" ||
          item.type === "fact"
        ).filter(matchItem);
      }
    }

    if (results.length && typeof results[0]['data-sort'] !== 'undefined') {
      results.sort((a, b) => {
        const sa = (a['data-sort'] === null || a['data-sort'] === undefined || a['data-sort'] === '') ? 999 : Number(a['data-sort']);
        const sb = (b['data-sort'] === null || b['data-sort'] === undefined || b['data-sort'] === '') ? 999 : Number(b['data-sort']);
        return sa - sb;
      });
    }

    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
      console.log("[SI] No results for input:", q);
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
      console.log("[SI] Suggestions rendered:", results.length);
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') {
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    const queryWords = q.split(/\s+/).filter(Boolean);
    const isNegative = notTriggers.some(tr => q.includes(tr)) || freeTriggers.some(tr => q.includes(tr));
    const isFact = FACT_ALIASES.some(alias => alias.startsWith(q) || q.startsWith(alias) || alias.includes(q));

    function matchItem(item) {
      const fields = [...(item.triggers||[]), ...(item.keywords||[])];
      return queryWords.every(word =>
        fields.some(field => field === word || field.startsWith(word) || field.includes(word))
      );
    }

    const dogMatch = suggestions.filter(item => item.type.startsWith("dog-") && matchItem(item));
    const vaMatch = suggestions.filter(item => item.type === "value-add" && matchItem(item));

    let found = [];

    if (isFact) {
      found = suggestions.filter(item => item.type === "fact" && matchItem(item));
    } else if (dogMatch.length) {
      found = dogMatch;
    } else if (vaMatch.length) {
      found = vaMatch;
    } else if (isNegative) {
      found = suggestions.filter(item => (item.type === "ingredient-not-contains" || item.type === "free-of") && matchItem(item));
    } else {
      found = suggestions.filter(item =>
        (item.type === "ingredient-contains" || item.type === "ingredient-not-contains" || item.type === "free-of") &&
        matchItem(item)
      );
      if (!found.length) {
        found = suggestions.filter(item =>
          item.type.startsWith("dog-") ||
          item.type === "value-add" ||
          item.type === "fact"
        ).filter(matchItem);
      }
    }

    if (found.length) showAnswer(found[0].answer || 'No answer set.');
    else showAnswer('No answer set.');
    console.log("[SI] Enter key pressed; found results:", found.length);
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
  console.log("[SI] Module fully initialized!");
}
