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

function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  console.log("[SI] buildSiSuggestions running...");
  const s = [];
  const dataOne = row['data-one'];

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
        question: `Does ${dataOne} contain ${displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `Yes, ${dataOne} contains ${displayAs}.`,
        'data-sort': ing['data-sort'] ?? 999
      });
    }
  });

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
        question: `Does ${dataOne} contain ${displayAs}?`,
        keywords: allIngredientKeywords(ing),
        answer: `No, ${dataOne} does not contain ${displayAs}.`,
        'data-sort': ing['data-sort'] ?? 999
      });
    }
  });

  ["data-legumes","data-poultry","data-grain"].forEach(key => {
    if (row[key]) {
      const diet = row[key].replace(/ Free|-free|free/gi, '').trim();
      if (!diet) return;
      s.push({
        type: "free-of",
        triggers: [diet.toLowerCase(), ...freeTriggers, `${diet.toLowerCase()} free`],
        question: `Is ${dataOne} free of ${diet}?`,
        keywords: [diet.toLowerCase(), "free", `${diet.toLowerCase()} free`],
        answer: `Yes, ${dataOne} is free of ${diet}.`,
        'data-sort': row[`${key}-sort`] ?? 999
      });
    }
  });

  safeArray(row['va-data-fives']).forEach(d5 => {
    const va = vaMap[d5];
    if (!va || !va['data-one']) return;
    const q = `Does ${dataOne} help with ${va['data-one']}?`;
    const a = va.cf_description?.trim()
      || `${dataOne} is crafted for ${va['data-one'].toLowerCase()}.`;
    s.push({
      type: "value-add",
      triggers: vaKeywords(va),
      question: q,
      keywords: vaKeywords(va),
      answer: a,
      'data-sort': (typeof va['data-sort'] === 'number' ? va['data-sort'] : 999)
    });
  });

  FACTS.forEach(f => {
    if (row[f.key] !== undefined && row[f.key] !== null && row[f.key] !== "") {
      const val = row[f.key];
      const label = f.label.replace(/[(%)]/g, '').trim();
      s.push({
        type: "fact",
        triggers: [label.toLowerCase(), ...f.aliases.map(a => a.toLowerCase())],
        question: `What is the ${label} in ${dataOne}?`,
        keywords: [...f.aliases.map(a => a.toLowerCase()), label.toLowerCase()],
        answer: `${dataOne} contains ${val} ${label}.`,
        'data-sort': f['data-sort'] ?? 999
      });
    }
  });

  const dogSeen = new Set();
  const mappedDogObjs = safeArray(row['dogBr-fives'])
    .map(d5 => dogMap[d5])
    .filter(dog => !!dog);

  mappedDogObjs.forEach(dog => {
    if (!dog['data-one'] || dogSeen.has(dog['data-one'])) return;
    dogSeen.add(dog['data-one']);
    s.push({
      type: "dog-breed",
      triggers: dogKeywords(dog),
      question: `Is ${dataOne} recommended for ${dog['data-one']}?`,
      keywords: dogKeywords(dog),
      answer: `Yes, ${dataOne} is recommended for ${dog['data-one']}.`,
      'data-sort': (typeof dog['data-sort'] === 'number' ? dog['data-sort'] : 999)
    });
  });

  function collectAllFromDogs(field) {
    return Array.from(new Set(
      mappedDogObjs.flatMap(dog => (dog[field] || '').split(',').map(s => s.trim()).filter(Boolean))
    ));
  }
  collectAllFromDogs('group-suit').forEach(group => {
    if (dogSeen.has('group:' + group)) return;
    dogSeen.add('group:' + group);
    s.push({
      type: "dog-group",
      triggers: [group.toLowerCase()],
      question: `Is ${dataOne} suitable for ${group}?`,
      keywords: [group.toLowerCase()],
      answer: `Yes, ${dataOne} is suitable for ${group}.`,
      'data-sort': 999
    });
  });
  collectAllFromDogs('activity-suit').forEach(activity => {
    if (dogSeen.has('activity:' + activity)) return;
    dogSeen.add('activity:' + activity);
    s.push({
      type: "dog-activity",
      triggers: [activity.toLowerCase()],
      question: `Is ${dataOne} suitable for ${activity}?`,
      keywords: [activity.toLowerCase()],
      answer: `Yes, ${dataOne} is suitable for ${activity}.`,
      'data-sort': 999
    });
  });
  collectAllFromDogs('job-suit').forEach(job => {
    if (dogSeen.has('job:' + job)) return;
    dogSeen.add('job:' + job);
    s.push({
      type: "dog-job",
      triggers: [job.toLowerCase()],
      question: `Is ${dataOne} suitable for ${job}?`,
      keywords: [job.toLowerCase()],
      answer: `Yes, ${dataOne} is suitable for ${job}.`,
      'data-sort': 999
    });
  });
  collectAllFromDogs('activity-level').forEach(level => {
    if (dogSeen.has('level:' + level)) return;
    dogSeen.add('level:' + level);
    s.push({
      type: "dog-activity-level",
      triggers: [level.toLowerCase()],
      question: `Is ${dataOne} suitable for ${level} dogs?`,
      keywords: [level.toLowerCase()],
      answer: `Yes, ${dataOne} is suitable for ${level} dogs.`,
      'data-sort': 999
    });
  });

  if (!row['dogBr-fives'] || !row['dogBr-fives'].length) {
    const fallback = ["active adult", "breed", "dog", "60 lbs", "average", "default"];
    s.push({
      type: "dog-default",
      triggers: fallback,
      question: `Is ${dataOne} recommended for an active adult (60 lbs)?`,
      keywords: fallback,
      answer: `${dataOne} is recommended for an active adult dog (60 lbs).`,
      'data-sort': 999
    });
  }
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
    console.log("[SI] resetAll called!");
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
    console.log("[SI] Suggestions list rendered:", results.length);
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
    console.log("[SI] Enter key processed. Results:", found.length);
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
  console.log("[SI] initSearchSuggestions finished.");
}
