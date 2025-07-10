import { SI_DATA }    from './si.js';
import { VA_AGNOSTIC } from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

// Utility: Link generator for formulas
function linkifyFormula(row) {
  const name = row['data-one'] || row.Name || '';
  const slug = row['Slug'] || (name.toLowerCase().replace(/\s+/g, '-'));
  return `<a href="/si/${slug}" class="fsi-link" target="_blank">${name}</a>`;
}

// Utility: Get SI formula row by name (case-insensitive)
function getFormulaRow(name) {
  if (!name) return null;
  return SI_DATA.find(
    r => (r['data-one'] || r.Name || '').toLowerCase() === name.toLowerCase()
  );
}

// Utility: For leaderboard questions, return the relevant stat key
const NUTRIENT_FACTS = [
  { key: "ga_kcals_per_cup",   label: "Kcals/cup",  aliases: ["calories", "kcals", "kcals per cup", "kcal/cup"] },
  { key: "ga_crude_fat_%",     label: "Fat %",      aliases: ["fat", "fat %", "crude fat"] },
  { key: "ga_crude_protein_%", label: "Protein %",  aliases: ["protein", "protein %", "crude protein"] }
];
function detectNutrientKey(q) {
  const lq = q.toLowerCase();
  for (const f of NUTRIENT_FACTS) {
    if (f.aliases.some(a => lq.includes(a))) return f;
  }
  return null;
}

// Build all formula names for search/triggering
const FORMULA_NAMES = SI_DATA.map(r => r['data-one'] || r.Name).filter(Boolean);

// Build suggestions list
function buildFsiSuggestions() {
  const suggestions = [];

  // 1. Leaderboard agnostics: "highest protein", "most kcals", etc
  NUTRIENT_FACTS.forEach(fact => {
    const highest = SI_DATA.reduce((a, b) =>
      (Number(a[fact.key]) || 0) >= (Number(b[fact.key]) || 0) ? a : b
    );
    suggestions.push({
      type: 'leaderboard',
      triggers: [
        `highest ${fact.label.split(' ')[0].toLowerCase()}`,
        `most ${fact.label.split(' ')[0].toLowerCase()}`,
        `${fact.label.split(' ')[0].toLowerCase()} leaderboard`,
        ...fact.aliases
      ],
      question: `Which food has the highest ${fact.label.toLowerCase()}?`,
      answer: `${highest['data-one']} has the highest ${fact.label.toLowerCase()} (${highest[fact.key]}) among our foods.`,
      factKey: fact.key,
      label: fact.label
    });
  });

  // 2. Free from (poultry, legumes, peas)
  [
    { key: "data-poultry", name: "poultry" },
    { key: "data-legumes", name: "legumes" },
    { key: "data-peas",    name: "peas" }
  ].forEach(diet => {
    const formulas = SI_DATA.filter(row => (row[diet.key] || '').toLowerCase().includes('free'));
    if (formulas.length) {
      suggestions.push({
        type: 'freefrom',
        triggers: [`free from ${diet.name}`, `no ${diet.name}`, `${diet.name} free`, `without ${diet.name}`],
        question: `Which foods are free from ${diet.name}?`,
        answer: `These foods are free from ${diet.name}: ${formulas.map(linkifyFormula).join(', ')}.`,
        formulas
      });
    }
  });

  // 3. VA agnostics: best for [purpose], e.g. "best for agility"
  (Array.isArray(VA_AGNOSTIC) ? VA_AGNOSTIC : []).forEach(va => {
    if (!va || !va.tag || !Array.isArray(va.ids)) return;
    const formulas = va.ids.map(id => SI_DATA.find(row => String(row['data-five']) === String(id))).filter(Boolean);
    if (!formulas.length) return;
    suggestions.push({
      type: 'va-agnostic',
      triggers: [
        `best for ${va.tag.toLowerCase()}`,
        `${va.tag.toLowerCase()} dogs`,
        ...[va.tag.toLowerCase()]
      ],
      question: `Best food for ${va.tag}?`,
      answer: `For ${va.tag.toLowerCase()} dogs, we recommend ${formulas.map(linkifyFormula).join(', ').replace(/,([^,]*)$/, ' and$1')}.`,
      context: va.tag,
      formulas
    });
  });

  // 4. Dog agnostics: best for [breed]
  (Array.isArray(DOG_AGNOSTIC) ? DOG_AGNOSTIC : []).forEach(dog => {
    if (!dog || !dog.breed || !Array.isArray(dog.ids)) return;
    const formulas = dog.ids.map(id => SI_DATA.find(row => String(row['data-five']) === String(id))).filter(Boolean);
    if (!formulas.length) return;
    suggestions.push({
      type: 'dog-agnostic',
      triggers: [
        `best food for ${dog.breed.toLowerCase()}`,
        `best for ${dog.breed.toLowerCase()}`,
        `${dog.breed.toLowerCase()} dogs`
      ],
      question: `Best food for ${dog.breed}?`,
      answer: `For ${dog.breed.toLowerCase()}, we recommend ${formulas.map(linkifyFormula).join(', ').replace(/,([^,]*)$/, ' and$1')}.`,
      context: dog.breed,
      formulas
    });
  });

  // 5. Direct formula queries: "show me Cub"
  FORMULA_NAMES.forEach(name => {
    const row = getFormulaRow(name);
    if (!row) return;
    suggestions.push({
      type: 'show-formula',
      triggers: [
        `show me ${name.toLowerCase()}`,
        `${name.toLowerCase()} formula`,
        `${name.toLowerCase()} food`
      ],
      question: `Show me ${name}`,
      answer: `<b>${name}</b><br><a href="/si/${row.Slug}" class="fsi-link" target="_blank">View Full FAQ</a>`,
      formula: { name, url: `/si/${row.Slug}` }
    });
  });

  // 6. Fallback (no matches): show all formulas
  suggestions.push({
    type: 'fallback',
    triggers: [],
    question: 'Show all foods',
    answer: `Here are all our foods: ${SI_DATA.map(linkifyFormula).join(', ')}.`
  });

  return suggestions;
}

// ----- UI Logic -----
export function initFsiSuggestions() {
  console.log("[FSI] initFsiSuggestions called!");
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  const suggestions = buildFsiSuggestions();

  // Table rendering
  let tableDiv = document.getElementById('fsi-nutrient-table');
  if (!tableDiv) {
    tableDiv = document.createElement('div');
    tableDiv.id = 'fsi-nutrient-table';
    answerBox.parentNode.insertBefore(tableDiv, answerBox.nextSibling);
  }
  function clearTable() { tableDiv.innerHTML = ''; }

  function renderTable(factKey, highlightName) {
    if (!factKey) return clearTable();
    const headers = ['Formula', 'Protein %', 'Fat %', 'Kcals/cup', ''];
    tableDiv.innerHTML = `<table class="fsi-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody></tbody></table>`;
    const tbody = tableDiv.querySelector('tbody');
    SI_DATA.forEach(row => {
      const name = row['data-one'];
      const tr = document.createElement('tr');
      if (name === highlightName) tr.className = 'fsi-table-highlight';
      tr.innerHTML = `
        <td>${name}</td>
        <td>${row['ga_crude_protein_%']}</td>
        <td>${row['ga_crude_fat_%']}</td>
        <td>${row['ga_kcals_per_cup']}</td>
        <td><a href="/si/${row['Slug']}" class="fsi-link" target="_blank">View</a></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function showAnswer(item) {
    answerTxt.innerHTML = '';
    answerBox.style.display = 'block';
    list.style.display = 'none';
    starter.style.display = 'none';
    clearTable();

    if (item.type === 'leaderboard') {
      answerTxt.innerHTML = item.answer;
      // highlight highest value row
      const highest = SI_DATA.reduce((a, b) =>
        (Number(a[item.factKey]) || 0) >= (Number(b[item.factKey]) || 0) ? a : b
      );
      renderTable(item.factKey, highest['data-one']);
    } else if (item.type === 'va-agnostic' || item.type === 'dog-agnostic') {
      answerTxt.innerHTML = item.answer;
    } else if (item.type === 'freefrom') {
      answerTxt.innerHTML = item.answer;
    } else if (item.type === 'show-formula') {
      answerTxt.innerHTML = `<b>${item.formula.name}</b><br><a href="${item.formula.url}" class="fsi-link" target="_blank">View Full FAQ</a>`;
    } else if (item.type === 'fallback') {
      answerTxt.innerHTML = item.answer;
    } else {
      answerTxt.innerText = item.answer || '';
    }
  }

  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    clearTable();
  }

  function renderStarter() {
    starter.innerHTML = '';
    suggestions.slice(0, 7).forEach(item => {
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

    function matchItem(item) {
      const fields = [...(item.triggers||[])];
      return fields.some(field => q.includes(field));
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

    function matchItem(item) {
      const fields = [...(item.triggers||[])];
      return fields.some(field => q.includes(field));
    }
    let found = suggestions.filter(matchItem);

    if (found.length) showAnswer(found[0]);
    else showAnswer(suggestions[suggestions.length-1]); // fallback: show all
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
  clearTable();
  console.log("[FSI] initFsiSuggestions finished.");
}


