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

function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];
  const dataOne = row['data-one'];

  // --- INGREDIENT CONTAINS ---
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

  // --- INGREDIENT NOT-CONTAINS (free-from) ---
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

  // --- FREE OF (poultry, legumes, grain) ---
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

  // --- VA-FORMULA-SPECIFIC (value-adds) ---
  safeArray(row['va-data-fives']).forEach(d5 => {
    const va = vaMap[d5];
    if (!va || !va['data-one']) return;
    const q = `Is ${dataOne} ${va['data-one'].toLowerCase()}?`;
    const a = va.cf_description?.trim()
      || `${dataOne} is crafted for ${va['data-one'].toLowerCase()}.`;
    s.push({
      type: "va-formula-specific",
      triggers: vaKeywords(va),
      question: q,
      keywords: vaKeywords(va),
      answer: a,
      'data-sort': (typeof va['data-sort'] === 'number' ? va['data-sort'] : 999)
    });
  });

  // --- FACTS (protein %, fat %, etc) ---
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

  // --- DOG BREED RECOMMENDATIONS ---
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

  // --- DOG SUITABILITY GROUPS/ACTIVITIES/JOBS/LEVELS ---
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

  // --- FALLBACK (generic active adult dog) ---
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

  // --- AGNOSTIC SUGGESTIONS ---
// --- AGNOSTIC SUGGESTIONS ---
// These phrases are what people will type and expect results for
const AGNOSTIC_PREFIXES = ["best", "top", "recommended", "most popular", "highest rated", "highest protein", "calorie dense"];

// (1) VA AGNOSTIC SUGGESTIONS
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
      AGNOSTIC_PREFIXES.forEach(prefix => {
        s.push({
          type: "va-agnostic",
          triggers: [
            prefix,
            tagStr.toLowerCase(),
            `${prefix} ${tagStr.toLowerCase()}`,
            `${prefix} ${tagStr.replace(/-/g, ' ').toLowerCase()}`,
            `${prefix} ${va.tag.replace(/-/g, ' ').toLowerCase()} kibble`,
            `${prefix} ${va.tag.replace(/-/g, ' ').toLowerCase()} dog food`,
          ],
          question: `${prefix.charAt(0).toUpperCase()+prefix.slice(1)} ${va.tag.replace(/-/g, ' ')} kibble?`,
          keywords: [prefix, tagStr.toLowerCase()],
          answer: `Try formulas: ${va.ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            return row ? (row['data-one'] || row.Name || id) : id;
          }).join(", ")}`,
          description: typeof va.description === "string" ? va.description : ""
        });
      });
    }
  });
}

if (Array.isArray(DOG_AGNOSTIC)) {
  DOG_AGNOSTIC.forEach(dog => {
    if (
      typeof dog === "object" &&
      dog &&
      typeof dog.breed === "string" &&
      dog.breed.trim() &&
      Array.isArray(dog.ids) &&
      dog.ids.length
    ) {
      const breed = dog.breed.trim();
      AGNOSTIC_PREFIXES.forEach(prefix => {
        s.push({
          type: "dog-agnostic",
          triggers: [
            ...dog.triggers,
            prefix,
            `${prefix} ${breed.toLowerCase()}`,
            `${prefix} kibble for ${breed.toLowerCase()}`,
            `${prefix} dog food for ${breed.toLowerCase()}`
          ],
          question: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} kibble for ${breed}?`,
          keywords: [
            ...dog.triggers,
            breed.toLowerCase(),
            prefix
          ],
          answer: `Recommended formulas for ${breed}: ${dog.ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            // If you want links, generate them here:
            if (row) {
              const name = row['data-one'] || row.Name || id;
              // Assuming you have a URL slug in row['Slug']
              const slug = row['Slug'] || '';
              return `<a href="/item-profiles/${slug}" target="_blank">${name}</a>`;
            }
            return id;
          }).join(", ")}`,
          description: typeof dog.description === "string" ? dog.description : ""
        });
      });
    }
  });
}


// (3) VA+DOG AGNOSTIC SUGGESTIONS
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
            AGNOSTIC_PREFIXES.forEach(prefix => {
              s.push({
                type: "va-dog-agnostic",
                triggers: [
                  prefix,
                  vaTagStr.toLowerCase(),
                  dogTagStr.toLowerCase(),
                  `${prefix} ${vaTagStr.replace(/-/g, ' ').toLowerCase()} for ${dogTagStr.replace(/-/g, ' ').toLowerCase()}`,
                  `${prefix} ${vaTagStr.replace(/-/g, ' ').toLowerCase()} kibble for ${dogTagStr.replace(/-/g, ' ').toLowerCase()}`,
                  `${prefix} dog food for ${dogTagStr.replace(/-/g, ' ').toLowerCase()} with ${vaTagStr.replace(/-/g, ' ').toLowerCase()}`
                ],
                question: `${prefix.charAt(0).toUpperCase()+prefix.slice(1)} ${va.tag.replace(/-/g, ' ')} kibble for ${dog.tag}?`,
                keywords: [prefix, vaTagStr.toLowerCase(), dogTagStr.toLowerCase()],
                answer: `Recommended ${va.tag.replace(/-/g, ' ')} formulas for ${dog.tag}: ${matches.map(id => {
                  const row = SI_DATA.find(r => String(r['data-five']) === String(id));
                  return row ? (row['data-one'] || row.Name || id) : id;
                }).join(", ")}`,
                description:
                  (typeof va.description === "string" ? va.description : "") +
                  (typeof dog.description === "string" && dog.description ? " for " + dogTagStr : "")
              });
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
const pillsRow = document.querySelector('.pwr-pills-row');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');

  function showSuggestionsList() {
  if (pillsRow) pillsRow.style.display = 'none';
  if (list)     list.style.display = 'block';
}

function showPillsRow() {
  if (pillsRow) pillsRow.style.display = 'flex';
  if (list)     list.style.display = 'none';
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
console.log("[SI] Suggestions:", suggestions);

function renderPills(pills) {
  const initialSuggestions = document.getElementById('pwr-initial-suggestions');
  initialSuggestions.innerHTML = '';
  pills.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'pwr-pill pwr-suggestion-pill';
    btn.type = 'button';
    btn.textContent = item.question;
    btn.addEventListener('click', e => {
      e.preventDefault();
      input.value = item.question;
      list.style.display = 'none';
      showAnswer(item.answer);
    });
    initialSuggestions.appendChild(btn);
  });
  initialSuggestions.style.display = 'flex';
  if (pillsRow) pillsRow.style.display = pills.length ? 'flex' : 'none';
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
  showPillsRow();
  starter.style.display = 'flex';
  answerBox.style.display = 'none';
  list.style.display = 'none';
}

input.addEventListener('input', () => {
  const q = input.value.trim().toLowerCase();
  list.innerHTML = '';
  if (!q) {
    showPillsRow();                 // Show the pills row + arrows
    list.style.display = 'none';    // Hide suggestion list
    starter.style.display = 'flex'; // Show the pills
    return;
  }
  hidePillsRow();                  // Hide the pills row + arrows
  list.style.display = 'block';    // Show suggestion list
  starter.style.display = 'none';  // Hide the pills

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
  renderPills(suggestions.slice(0, 6));   // <--- use this, not renderStarter()
  console.log("[SI] initSearchSuggestions finished.");
}
