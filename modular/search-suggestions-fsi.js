import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }      from './si.js';
import { VA_DATA }      from './va.js';
import { DOG_DATA }     from './dog.js';
import { VA_AGNOSTIC }  from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

// Use exactly these, not triggers
const notTriggers = [ "does not", "doesn't", "dont", "don't", "without", "free of", "not contain", "excludes", "exclude", "minus", "no", "not" ];
const freeTriggers = [ "free", "free of", "without", "minus", "no" ];
const FACTS = [
  { key: "ga_crude_protein_%", label: "Protein (%)", aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",     label: "Fat (%)",     aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_kcals_per_cup",   label: "kcals per cup", aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] }
];
const FACT_ALIASES = [];
FACTS.forEach(f => FACT_ALIASES.push(...f.aliases.map(a => a.toLowerCase()), f.label.toLowerCase()));

// Use *all* SI rows for suggestions (not just one row)
function buildFsiSuggestions(siRows, vaMap, dogMap) {
  const s = [];
  const allRows = siRows;

  // AGNOSTIC SUGGESTIONS (Best, Top, Recommended, Highest, etc)
  if (Array.isArray(VA_AGNOSTIC)) {
    VA_AGNOSTIC.forEach(va => {
      if (typeof va === "object" && va && typeof va.tag === "string" && va.tag.trim() && Array.isArray(va.ids) && va.ids.length) {
        const tagStr = va.tag.trim();
        ["best","top","recommended","most popular","highest rated"].forEach(prefix => {
          const formulas = va.ids.map(id => {
            const row = allRows.find(r => String(r['data-five']) === String(id));
            if (!row) return null;
            return `<a href="/si/${row['Slug']}" target="_blank">${row['data-one'] || row.Name || id}</a>`;
          }).filter(Boolean).join(', ');
          s.push({
            type: "va-agnostic",
            triggers: [
              prefix,
              tagStr.toLowerCase(),
              `${prefix} ${tagStr.toLowerCase()}`,
              `${prefix} ${tagStr.replace(/-/g, ' ').toLowerCase()}`
            ],
            question: `${prefix.charAt(0).toUpperCase()+prefix.slice(1)} food for ${va.tag.replace(/-/g,' ')}?`,
            keywords: [prefix, tagStr.toLowerCase()],
            answer: `Formulas for ${va.tag.replace(/-/g,' ')}: ${formulas}`,
            description: typeof va.description === "string" ? va.description : ""
          });
        });
      }
    });
  }

  if (Array.isArray(DOG_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (typeof dog === "object" && dog && typeof dog.breed === "string" && dog.breed.trim() && Array.isArray(dog.ids) && dog.ids.length) {
        const breed = dog.breed.trim();
        ["best","top","recommended","most popular","highest rated"].forEach(prefix => {
          const formulas = dog.ids.map(id => {
            const row = allRows.find(r => String(r['data-five']) === String(id));
            if (!row) return null;
            return `<a href="/si/${row['Slug']}" target="_blank">${row['data-one'] || row.Name || id}</a>`;
          }).filter(Boolean).join(', ');
          s.push({
            type: "dog-agnostic",
            triggers: [
              prefix,
              breed.toLowerCase(),
              `${prefix} ${breed.toLowerCase()}`
            ],
            question: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} food for ${breed}?`,
            keywords: [prefix, breed.toLowerCase()],
            answer: `Formulas for ${breed}: ${formulas}`,
            description: typeof dog.description === "string" ? dog.description : ""
          });
        });
      }
    });
  }

  // "Show me [Cub/Dock/Herding]"
  allRows.forEach(row => {
    const name = row['data-one'] || row.Name;
    if (!name) return;
    s.push({
      type: "direct-formula",
      triggers: [`show me ${name.toLowerCase()}`],
      question: `Show me ${name}`,
      keywords: [name.toLowerCase()],
      answer: `<b>${name}</b> — <a href="/si/${row['Slug']}" target="_blank">View full details</a>`,
    });
  });

  // Highest/Lowest for kcals, protein, fat: always show table, do NOT select winner
  ["kcals", "calories", "protein", "fat"].forEach(metric => {
    s.push({
      type: "leaderboard",
      triggers: [metric, `highest ${metric}`, `most ${metric}`],
      question: `Show table for ${metric}`,
      keywords: [metric, `highest ${metric}`],
      answer: `Here's a comparison of all formulas for ${metric}. See the table below.`,
      leaderboardMetric: metric
    });
  });

  // Any other query (e.g. "Does Cub contain Flaxseed?"): send to SI
  allRows.forEach(row => {
    const name = row['data-one'] || row.Name;
    if (!name) return;
    s.push({
      type: "forward-detail",
      triggers: [name.toLowerCase()],
      question: `Does ${name} contain [ingredient]?`,
      keywords: [name.toLowerCase()],
      answer: `Want details on ${name}? <a href="/si/${row['Slug']}" target="_blank">View FAQ for ${name}</a>`
    });
  });

  return s;
}

// Table rendering (just like you described: always visible below answer if leaderboard type)
function renderNutritionTable(metric) {
  const metricKey =
    metric.includes("kcal") ? "ga_kcals_per_cup" :
    metric.includes("protein") ? "ga_crude_protein_%" :
    metric.includes("fat") ? "ga_crude_fat_%" : null;
  if (!metricKey) return "";
  const header = `<tr><th>Formula</th><th>Protein (%)</th><th>Fat (%)</th><th>Kcals/cup</th><th>Link</th></tr>`;
  const rows = SI_DATA.map(row => {
    const name = row['data-one'] || row.Name;
    const slug = row['Slug'];
    return `<tr>
      <td>${name}</td>
      <td>${row['ga_crude_protein_%'] || ""}</td>
      <td>${row['ga_crude_fat_%'] || ""}</td>
      <td>${row['ga_kcals_per_cup'] || ""}</td>
      <td><a href="/si/${slug}" target="_blank">View</a></td>
    </tr>`;
  }).join('');
  return `<table class="fsi-leaderboard-table">${header}${rows}</table>`;
}

// UI logic
export function initFsiSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  let tableBox   = document.getElementById('fsi-table-output');
  if (!tableBox) {
    tableBox = document.createElement('div');
    tableBox.id = 'fsi-table-output';
    answerBox.parentNode.insertBefore(tableBox, answerBox.nextSibling);
  }

  // Build suggestions globally for all SI rows
  const ingMap = {}; // not used in fsi
  const vaMap  = VA_DATA;
  const dogMap = DOG_DATA;
  const suggestions = buildFsiSuggestions(SI_DATA, vaMap, dogMap);

  function showAnswer(item) {
    answerTxt.innerHTML = "";
    answerBox.style.display = 'block';
    tableBox.innerHTML = '';
    // If leaderboard/table type, show table after answer box
    if (item && item.type === "leaderboard") {
      answerTxt.innerHTML = item.answer;
      tableBox.innerHTML = renderNutritionTable(item.leaderboardMetric);
      tableBox.style.display = 'block';
    } else if (item && item.answer) {
      answerTxt.innerHTML = item.answer;
      tableBox.style.display = 'none';
      tableBox.innerHTML = '';
    }
    starter.style.display = 'none';
    list.style.display    = 'none';
  }

  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    tableBox.style.display = 'none';
    tableBox.innerHTML = '';
  }

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
    else showAnswer({answer:'No answer set.'});
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  tableBox.style.display = 'none';
  renderStarter();
}
