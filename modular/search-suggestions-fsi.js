import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { VA_AGNOSTIC } from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

console.log("[FSI] Module loaded. SI_DATA, VA_AGNOSTIC, DOG_AGNOSTIC imported.");

const AGNOSTIC_PREFIXES = ["best", "top", "recommended", "most popular", "highest rated", "highest", "lowest", "most", "protein", "fat", "kcals", "calories"];
const NUTRIENT_KEYS = [
  { key: "ga_crude_protein_%", label: "Protein (%)" },
  { key: "ga_crude_fat_%", label: "Fat (%)" },
  { key: "ga_kcals_per_cup", label: "Kcals/Cup" }
];
const NUTRIENT_TRIGGERS = [
  "highest protein", "most protein", "protein", "best protein",
  "highest fat", "most fat", "fat", "best fat",
  "highest kcals", "most kcals", "kcals", "calories", "best kcals", "best calories"
];

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function siUrl(row) {
  // Row must have Slug, fallback to data-one or data-five
  let slug = row['Slug'] || row['slug'] || row['data-one'] || row['data-five'];
  if (!slug) slug = row.Name;
  slug = String(slug).toLowerCase().replace(/[^\w\d]+/g, "-");
  return `/si/${slug}`;
}

// --- Suggestion Builder ---
function buildFsiSuggestions() {
  const suggestions = [];

  // --- Agnostic (Value-Add, Activity, Group, etc) ---
  if (Array.isArray(VA_AGNOSTIC)) {
    VA_AGNOSTIC.forEach(va => {
      if (!va || !va.tag || !Array.isArray(va.ids) || !va.ids.length) return;
      const ids = va.ids;
      AGNOSTIC_PREFIXES.forEach(prefix => {
        suggestions.push({
          type: "va-agnostic",
          triggers: [
            prefix,
            va.tag.toLowerCase(),
            `${prefix} ${va.tag.toLowerCase()}`,
            `${prefix} ${va.tag.replace(/-/g, ' ').toLowerCase()}`,
            `${prefix} ${va.tag.replace(/-/g, ' ').toLowerCase()} food`
          ],
          question: `${prefix.charAt(0).toUpperCase()+prefix.slice(1)} food for ${va.tag.replace(/-/g, ' ')}?`,
          keywords: [prefix, va.tag.toLowerCase()],
          answer: `Here are our formulas for ${va.tag.replace(/-/g, ' ')}: ${ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            if (row) return `<a href="${siUrl(row)}" target="_blank">${row['data-one'] || row.Name || id}</a>`;
            return id;
          }).join(", ")}`,
          formulas: ids
        });
      });
    });
  }

  // --- Dog Agnostic (by breed/activity) ---
  if (Array.isArray(DOG_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (!dog || !dog.breed || !Array.isArray(dog.ids) || !dog.ids.length) return;
      AGNOSTIC_PREFIXES.forEach(prefix => {
        suggestions.push({
          type: "dog-agnostic",
          triggers: [
            prefix,
            dog.breed.toLowerCase(),
            `${prefix} ${dog.breed.toLowerCase()}`,
            `${prefix} food for ${dog.breed.toLowerCase()}`,
            `${prefix} dog food for ${dog.breed.toLowerCase()}`
          ],
          question: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} food for ${dog.breed}?`,
          keywords: [prefix, dog.breed.toLowerCase()],
          answer: `Here are our formulas for ${dog.breed}: ${dog.ids.map(id => {
            const row = SI_DATA.find(r => String(r['data-five']) === String(id));
            if (row) return `<a href="${siUrl(row)}" target="_blank">${row['data-one'] || row.Name || id}</a>`;
            return id;
          }).join(", ")}`,
          formulas: dog.ids
        });
      });
    });
  }

  // --- Nutrient Table (protein, fat, kcals) ---
  suggestions.push({
    type: "nutrient-table",
    triggers: NUTRIENT_TRIGGERS,
    question: "Show me the nutrition chart",
    keywords: NUTRIENT_TRIGGERS,
    answer: "Here’s a nutrition chart for all our formulas below.",
    formulas: SI_DATA.map(r => r['data-five'])
  });

  // --- Formula Direct Query (Show me [formula]) ---
  SI_DATA.forEach(row => {
    const name = (row['data-one'] || row.Name || "").toLowerCase();
    if (!name) return;
    suggestions.push({
      type: "formula-direct",
      triggers: [`show me ${name}`, name, `see ${name}`],
      question: `Show me ${name.charAt(0).toUpperCase()+name.slice(1)}`,
      keywords: [name],
      answer: `<a href="${siUrl(row)}" target="_blank">Click here to view full details about ${name.charAt(0).toUpperCase()+name.slice(1)}</a>`,
      formulas: [row['data-five']]
    });
  });

  // --- Forward for all ingredient/detail queries (fallback) ---
  SI_DATA.forEach(row => {
    const name = (row['data-one'] || row.Name || "").toLowerCase();
    if (!name) return;
    suggestions.push({
      type: "ingredient-forward",
      triggers: [
        `does ${name} contain`, `ingredients in ${name}`, `is ${name}`,
        `about ${name}`, `details for ${name}`, `what's in ${name}`, `is ${name} free from`
      ],
      question: `View details about ${name.charAt(0).toUpperCase()+name.slice(1)}`,
      keywords: [name],
      answer: `<a href="${siUrl(row)}" target="_blank">Click here to view full details about ${name.charAt(0).toUpperCase()+name.slice(1)}</a>`,
      formulas: [row['data-five']]
    });
  });

  return suggestions;
}

// --- Render Nutrition Table (below answer) ---
function renderNutritionTable(targetId) {
  // Remove any existing table
  let existing = document.getElementById('fsi-nutrition-table');
  if (existing) existing.remove();

  // Build table
  let table = document.createElement('table');
  table.id = 'fsi-nutrition-table';
  table.style = "margin: 1.8rem 0 0 0; width:100%; border-radius:1rem; border-collapse:separate; border-spacing:0; background:#181818;";
  let thead = document.createElement('thead');
  let tbody = document.createElement('tbody');
  let trHead = document.createElement('tr');
  ["Formula", "Protein (%)", "Fat (%)", "Kcals/Cup", "Details"].forEach(t => {
    let th = document.createElement('th');
    th.textContent = t;
    th.style = "padding:0.66em 1em;text-align:left;background:#232323;color:#fff;font-weight:700;font-size:1.07rem;border-radius:0.7rem 0.7rem 0 0;";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  SI_DATA.forEach(row => {
    let tr = document.createElement('tr');
    tr.style = "background:#212126; border-radius:0.55rem;";
    let name = row['data-one'] || row.Name || "";
    let slug = siUrl(row);
    let protein = row['ga_crude_protein_%'] || "";
    let fat = row['ga_crude_fat_%'] || "";
    let kcals = row['ga_kcals_per_cup'] || "";
    [name,
     protein,
     fat,
     kcals,
     `<a href="${slug}" style="color:#0056D6;text-decoration:underline;font-weight:600;" target="_blank">View Details</a>`
    ].forEach((val, idx) => {
      let td = document.createElement('td');
      td.innerHTML = val;
      td.style = "padding:0.82em 1em; font-size:1.07rem; color:#fafbfc; border:none;";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(thead);
  table.appendChild(tbody);

  let answerBox = document.getElementById(targetId);
  if (answerBox && answerBox.parentNode) {
    answerBox.parentNode.insertBefore(table, answerBox.nextSibling);
  }
}

// --- Main UI Logic (exactly like SI, except for global triggers/table) ---
export function initFsiSuggestions() {
  console.log("[FSI] initFsiSuggestions called!");
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) {
    console.log("[FSI] One or more input elements missing!");
    return;
  }

  const suggestions = buildFsiSuggestions();

  function renderStarter() {
    starter.innerHTML = '';
    suggestions.slice(0, 6).forEach(item => {
      const a = document.createElement('button');
      a.className = 'pwr-suggestion-pill';
      a.innerHTML = item.question;
      a.addEventListener('click', e => {
        e.preventDefault();
        input.value = item.question;
        list.style.display = 'none';
        showAnswer(item);
      });
      starter.appendChild(a);
    });
    starter.style.display = 'flex';
  }

  function clearNutritionTable() {
    let t = document.getElementById('fsi-nutrition-table');
    if (t) t.remove();
  }

  function showAnswer(item) {
    answerTxt.innerHTML = '';
    answerBox.style.display = 'block';
    clearNutritionTable();

    // If a nutrient-table suggestion, show table below answer
    if (item.type === "nutrient-table") {
      answerTxt.innerHTML = item.answer;
      renderNutritionTable('pwr-answer-output');
    }
    // Otherwise, madlib the answer
    else {
      answerTxt.innerHTML = item.answer;
    }
    starter.style.display = 'none';
    list.style.display    = 'none';
  }

  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    clearNutritionTable();
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    clearNutritionTable();
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';

    // Match suggestions by trigger/keyword
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
        li.innerHTML = item.question;
        li.addEventListener('click', () => {
          input.value = item.question;
          showAnswer(item);
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
    if (found.length) showAnswer(found[0]);
    else showAnswer({answer:'No answer set.', type: ''});
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
  console.log("[FSI] initFsiSuggestions finished.");
}
