// /search-suggestions-fsi.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }     from './si.js';
import { ING_ANIM }    from './ingAnim.js';
import { ING_PLANT }   from './ingPlant.js';
import { ING_SUPP }    from './ingSupp.js';
import { VA_DATA }     from './va.js';
import { DOG_DATA }    from './dog.js';
import { VA_AGNOSTIC } from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

// --- FSI: Load ALL relevant formulas ---
const FORMULA_NAMES = ["Cub", "Dock", "Herding"];
const FORMULAS = SI_DATA.filter(r => FORMULA_NAMES.includes(r['data-one']));
const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// --- Helper: Get formula object by name ---
function getFormulaByName(name) {
  return FORMULAS.find(row => (row['data-one'] || '').toLowerCase() === name.toLowerCase());
}
function getFormulaSlug(row) {
  return row.Slug || (row['data-one']||"").toLowerCase();
}

// --- Helper: Safe array ---
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "string" && val.trim()) return [val];
  try { return Array.from(val); } catch { return []; }
}

// --- Core SI logic (verbatim copy of buildSiSuggestions) ---
function buildSiSuggestions(row, ingMap, vaMap, dogMap) {
  const s = [];
  const dataOne = row['data-one'];
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

  // --- AGNOSTIC SUGGESTIONS (abbreviated for brevity) ---
  // ...You can insert your AGNOSTIC logic as needed...

  return s;
}

// --- Table for Leaderboard (nutrition) ---
function buildNutritionTable(metricKey) {
  const metricMap = {
    "protein":    "ga_crude_protein_%",
    "fat":        "ga_crude_fat_%",
    "kcals":      "ga_kcals_per_cup",
    "calories":   "ga_kcals_per_cup",
    "kcals/cup":  "ga_kcals_per_cup",
    "protein%":   "ga_crude_protein_%",
    "fat%":       "ga_crude_fat_%"
  };
  const key = metricMap[metricKey] || metricKey;
  let rows = FORMULAS.map(row => ({
    name: row['data-one'],
    protein: row['ga_crude_protein_%'] || "",
    fat: row['ga_crude_fat_%'] || "",
    kcals: row['ga_kcals_per_cup'] || "",
    value: Number(row[key]),
    slug: getFormulaSlug(row)
  }));
  const maxVal = Math.max(...rows.map(r => isNaN(r.value) ? -Infinity : r.value));
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:1.2em;">
      <thead>
        <tr>
          <th style="text-align:left;padding:0.6em 0.8em;">Formula</th>
          <th style="text-align:left;padding:0.6em 0.8em;">Protein %</th>
          <th style="text-align:left;padding:0.6em 0.8em;">Fat %</th>
          <th style="text-align:left;padding:0.6em 0.8em;">Kcals/cup</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr${r.value === maxVal ? ' style="background:#262a3a;font-weight:700;"' : ''}>
            <td style="padding:0.6em 0.8em;">${r.name}</td>
            <td style="padding:0.6em 0.8em;">${r.protein}</td>
            <td style="padding:0.6em 0.8em;">${r.fat}</td>
            <td style="padding:0.6em 0.8em;">${r.kcals}</td>
            <td style="padding:0.6em 0.8em;">
              <a href="/item-profiles/${r.slug}" target="_blank" style="color:#1ebf3e;font-weight:bold;text-decoration:underline;">View</a>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// --- Build dynamic FSI suggestions (all formulas) ---
function buildFsiSuggestions() {
  let all = [];
  FORMULAS.forEach(row => {
    all = all.concat(buildSiSuggestions(row, ingMap, VA_DATA, DOG_DATA));
  });
  return all;
}

// --- Query Handler ---
function handleFsiQuery(query) {
  const q = (query||"").toLowerCase();

  // Nutrient leaderboard
  if (/\b(highest|most|top|best)\b.*\b(protein|fat|kcals?|calories|kcals\/cup|protein\/cup|fat\/cup)\b/.test(q)) {
    let metric = "kcals";
    if (/protein/.test(q)) metric = "protein";
    if (/fat/.test(q)) metric = "fat";
    if (/calories|kcals/.test(q)) metric = "kcals";
    const label = metric === "protein" ? "protein"
                : metric === "fat" ? "fat"
                : "calories";
    const winner = FORMULAS.reduce((a,b) =>
      (Number(b[metric === "protein" ? 'ga_crude_protein_%'
            : metric === "fat" ? 'ga_crude_fat_%'
            : 'ga_kcals_per_cup']) > Number(a[metric === "protein" ? 'ga_crude_protein_%'
            : metric === "fat" ? 'ga_crude_fat_%'
            : 'ga_kcals_per_cup']) ? b : a), FORMULAS[0]);
    const winnerName = winner['data-one'];
    const winnerValue = metric === "protein"
      ? winner['ga_crude_protein_%']
      : metric === "fat"
        ? winner['ga_crude_fat_%']
        : winner['ga_kcals_per_cup'];
    const unit = metric === "protein" ? "% protein"
      : metric === "fat" ? "% fat"
      : "kcals/cup";
    return `<div>${winnerName} has the highest ${label} (${winnerValue} ${unit}) among our foods.</div>${buildNutritionTable(metric)}`;
  }

  // Agnostic/intent: "best food for agility", "poultry free", etc
  if (/agility/.test(q)) {
    const agilityRows = FORMULAS.filter(r => /cub|dock/i.test(r['data-one']));
    const links = agilityRows.map(r =>
      `<a href="/item-profiles/${getFormulaSlug(r)}" target="_blank" style="color:#1ebf3e;font-weight:bold;text-decoration:underline;">${r['data-one']}</a>`
    );
    return `For agility dogs, we recommend ${links.join(" and ")}.`;
  }
  if (/poultry\s*free/.test(q)) {
    const poultryFree = FORMULAS.filter(r => /free of poultry|poultry free/i.test(r['data-poultry']||''));
    if (poultryFree.length) {
      const links = poultryFree.map(r =>
        `<a href="/item-profiles/${getFormulaSlug(r)}" target="_blank" style="color:#1ebf3e;font-weight:bold;text-decoration:underline;">${r['data-one']}</a>`
      );
      return `All of these foods are poultry free: ${links.join(" and ")}.`;
    }
  }

  // Direct formula ("Show me Cub" etc)
  const directMatch = q.match(/show me (cub|dock|herding)/);
  if (directMatch) {
    const name = directMatch[1].charAt(0).toUpperCase() + directMatch[1].slice(1).toLowerCase();
    const row = getFormulaByName(name);
    if (!row) return "No data found.";
    return `
      <div>
        <b>${row['data-one']}</b><br>
        <span>${row['short_desc'] || "No description available."}</span><br>
        <a href="/item-profiles/${getFormulaSlug(row)}" target="_blank" style="color:#1ebf3e;font-weight:bold;text-decoration:underline;">View full FAQ</a>
      </div>
    `;
  }

  // Ingredient/contains/fallback: "Does Cub contain Flaxseed"
  const containMatch = q.match(/(?:does|is)\s+(cub|dock|herding)[^?]*\b(contain|free of|have|include|with|without|minus|not contain)\b/i);
  if (containMatch) {
    const name = containMatch[1].charAt(0).toUpperCase() + containMatch[1].slice(1).toLowerCase();
    const row = getFormulaByName(name);
    if (!row) return "No data found.";
    return `
      Let's take a closer look at ${name}!<br>
      <a href="/item-profiles/${getFormulaSlug(row)}" target="_blank" style="color:#1ebf3e;font-weight:bold;text-decoration:underline;">View full ${name} FAQ</a>
    `;
  }

  // Fallback: use regular SI suggestion logic if none of the above matches
  const suggestions = buildFsiSuggestions();
  const queryWords = q.split(/\s+/).filter(Boolean);
  function matchItem(item) {
    const fields = [...(item.triggers||[]), ...(item.keywords||[])];
    return queryWords.every(word =>
      fields.some(field => field === word || field.startsWith(word) || field.includes(word))
    );
  }
  let found = suggestions.filter(matchItem);

  if (found.length) return found[0].answer || 'No answer set.';
  return 'No answer set.';
}

// --- UI Logic ---
export function initFsiSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  const suggestions = buildFsiSuggestions();

  function renderStarter() {
    starter.innerHTML = '';
    suggestions.slice(0, 8).forEach(item => {
      const a = document.createElement('button');
      a.className = 'pwr-suggestion-pill';
      a.textContent = item.question;
      a.addEventListener('click', e => {
        e.preventDefault();
        input.value = item.question;
        list.style.display = 'none';
        showAnswer(handleFsiQuery(item.question));
      });
      starter.appendChild(a);
    });
    starter.style.display = 'flex';
  }

  function showAnswer(html) {
    answerTxt.innerHTML = html;
    answerBox.style.display = 'block';
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
    const q = input.value.trim();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';

    let found = suggestions.filter(item =>
      item.question.toLowerCase().includes(q.toLowerCase())
    );
    if (!found.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
    } else {
      found.slice(0, 7).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', () => {
          input.value = item.question;
          showAnswer(handleFsiQuery(item.question));
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') {
    const q = input.value.trim();
    if (!q) return;
    showAnswer(handleFsiQuery(q));
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
}
