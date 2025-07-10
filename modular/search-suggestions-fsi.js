import { SI_DATA }      from './si.js';
import { ING_ANIM }     from './ingAnim.js';
import { ING_PLANT }    from './ingPlant.js';
import { ING_SUPP }     from './ingSupp.js';
import { VA_DATA }      from './va.js';
import { DOG_DATA }     from './dog.js';
import { VA_AGNOSTIC }  from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

// Use the same FACTS structure as SI
const FACTS = [
  { key: "ga_crude_protein_%", label: "Protein %", aliases: ["protein", "crude protein", "protein %"] },
  { key: "ga_crude_fat_%",     label: "Fat %",     aliases: ["fat", "crude fat", "fat %"] },
  { key: "ga_kcals_per_cup",   label: "Kcals/cup", aliases: ["calories", "kcals", "kcals per cup", "kcals/cup"] },
];

function linkifyFormula(row) {
  if (!row) return '';
  const name = row['data-one'] || row.Name || '';
  const slug = row['Slug'] || '';
  // Use /si/ not /item-profiles/
  return `<a href="/si/${slug}" target="_blank">${name.toUpperCase()}</a>`;
}

// Helper to match query intent
function includesAny(str, arr) {
  str = str.toLowerCase();
  return arr.some(val => str.includes(val));
}

// Build all pills and suggestions for all formulas
function buildFsiSuggestions(siData, ingMap, vaMap, dogMap) {
  const suggestions = [];
  // ----------- AGNOSTIC / "BEST" -------------
  if (Array.isArray(VA_AGNOSTIC)) {
    VA_AGNOSTIC.forEach(va => {
      if (va.tag && va.ids && va.ids.length) {
        const formulas = va.ids.map(id => siData.find(r => String(r['data-five']) === String(id))).filter(Boolean);
        if (formulas.length) {
          suggestions.push({
            type: 'va-agnostic',
            triggers: [
              `best for ${va.tag.toLowerCase()}`,
              `best food for ${va.tag.toLowerCase()}`,
              va.tag.toLowerCase()
            ],
            question: `Best food for ${va.tag}?`,
            answer: `For ${va.tag.toLowerCase()} dogs, we recommend ${formulas.map(linkifyFormula).join(', ')}.`,
            formulas
          });
        }
      }
    });
  }

  if (Array.isArray(DOG_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (dog.breed && dog.ids && dog.ids.length) {
        const formulas = dog.ids.map(id => siData.find(r => String(r['data-five']) === String(id))).filter(Boolean);
        if (formulas.length) {
          suggestions.push({
            type: 'dog-agnostic',
            triggers: [
              `best for ${dog.breed.toLowerCase()}`,
              `best food for ${dog.breed.toLowerCase()}`,
              dog.breed.toLowerCase()
            ],
            question: `Best food for ${dog.breed}s?`,
            answer: `For ${dog.breed.toLowerCase()}s, we recommend ${formulas.map(linkifyFormula).join(', ')}.`,
            formulas
          });
        }
      }
    });
  }

  // ----------- NUTRIENT LEADERBOARD -------------
  FACTS.forEach(fact => {
    // Find the "highest" and "lowest" food for each fact
    let max = -Infinity, min = Infinity, winner = null, loser = null;
    siData.forEach(row => {
      let val = Number(row[fact.key]);
      if (!isNaN(val)) {
        if (val > max) { max = val; winner = row; }
        if (val < min) { min = val; loser = row; }
      }
    });
    // Highest
    suggestions.push({
      type: 'leaderboard',
      triggers: [
        `highest ${fact.label.toLowerCase()}`,
        `highest ${fact.aliases[0]}`,
        `most ${fact.aliases[0]}`,
        fact.aliases[0]
      ],
      question: `Highest ${fact.label}?`,
      answer: `${winner ? (winner['data-one'] || winner.Name) : 'One formula'} has the highest ${fact.label.toLowerCase()} (${winner ? winner[fact.key] : 'n/a'}) among our foods.`,
      factKey: fact.key,
      factLabel: fact.label,
      winner,
      allRows: siData
    });
    // Lowest (optional)
    suggestions.push({
      type: 'leaderboard',
      triggers: [
        `lowest ${fact.label.toLowerCase()}`,
        `least ${fact.aliases[0]}`,
        `fewest ${fact.aliases[0]}`
      ],
      question: `Lowest ${fact.label}?`,
      answer: `${loser ? (loser['data-one'] || loser.Name) : 'One formula'} has the lowest ${fact.label.toLowerCase()} (${loser ? loser[fact.key] : 'n/a'}) among our foods.`,
      factKey: fact.key,
      factLabel: fact.label,
      winner: loser,
      allRows: siData
    });
  });

  // ----------- FREE FROM (poultry, legumes, peas) -------------
  [
    { key: 'data-poultry', name: 'poultry' },
    { key: 'data-legumes', name: 'legumes' },
    { key: 'data-peas', name: 'peas' }
  ].forEach(diet => {
    const formulas = siData.filter(row => {
      // Only formulas where the flag is true/yes or 'Free'
      const val = row[diet.key];
      if (!val) return false;
      return String(val).toLowerCase().includes('free');
    });
    if (formulas.length) {
      suggestions.push({
        type: 'free-from',
        triggers: [
          `free from ${diet.name}`,
          `without ${diet.name}`,
          `${diet.name} free`
        ],
        question: `Which foods are free from ${diet.name}?`,
        answer: `These foods are free from ${diet.name}: ${formulas.map(linkifyFormula).join(', ')}.`,
        formulas
      });
    }
  });

  // ----------- DIRECT FORMULA QUERIES (Show me X) -------------
  siData.forEach(row => {
    const name = row['data-one'] || row.Name || '';
    const slug = row['Slug'] || '';
    suggestions.push({
      type: 'direct-formula',
      triggers: [
        `show me ${name.toLowerCase()}`,
        `see ${name.toLowerCase()}`,
        name.toLowerCase()
      ],
      question: `Show me ${name}`,
      answer: `${name}<br>No description available.<br><a href="/si/${slug}" target="_blank">VIEW FULL FAQ</a>`,
      formula: row
    });
  });

  // ----------- INGREDIENT/FALLBACK (Does Cub contain Flaxseed) -------------
  // This is the "redirect to SI" fallback
  siData.forEach(row => {
    const name = row['data-one'] || row.Name || '';
    const slug = row['Slug'] || '';
    suggestions.push({
      type: 'ingredient-fallback',
      triggers: [
        `does ${name.toLowerCase()} contain`, `ingredients in ${name.toLowerCase()}`
      ],
      question: `Does ${name} contain [ingredient]?`,
      answer: `Let’s take a closer look at ${name}!<br><a href="/si/${slug}" target="_blank">View ${name} FAQ</a>`,
      formula: row
    });
  });

  return suggestions;
}

// Utility: build leaderboard table (render below answer)
function buildLeaderboardTable(factKey, allRows, winner) {
  if (!factKey || !allRows) return '';
  const rows = allRows.map(row => ({
    name: row['data-one'] || row.Name,
    protein: row['ga_crude_protein_%'] || '',
    fat: row['ga_crude_fat_%'] || '',
    kcals: row['ga_kcals_per_cup'] || '',
    slug: row['Slug'] || ''
  }));
  return `
    <div id="fsi-leaderboard-table-wrap">
    <table class="fsi-leaderboard-table">
      <thead>
        <tr>
          <th>Formula</th><th>Protein %</th><th>Fat %</th><th>Kcals/cup</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr${winner && (r.name === (winner['data-one'] || winner.Name)) ? ' class="fsi-winner-row"' : ''}>
            <td>${r.name}</td>
            <td>${r.protein}</td>
            <td>${r.fat}</td>
            <td>${r.kcals}</td>
            <td><a href="/si/${r.slug}" target="_blank">VIEW</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
  `;
}

// --- UI/Interaction Logic ---
export function initFsiSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  const leaderboardContainerId = 'fsi-leaderboard-container';

  // Clean up any previous leaderboard tables
  function clearLeaderboard() {
    let el = document.getElementById(leaderboardContainerId);
    if (el) el.parentNode.removeChild(el);
  }

  // Data
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  const vaMap  = VA_DATA;
  const dogMap = DOG_DATA;
  const suggestions = buildFsiSuggestions(SI_DATA, ingMap, vaMap, dogMap);

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

  function showAnswer(item) {
    answerTxt.innerHTML = '';
    answerBox.style.display = 'block';
    clearLeaderboard();

    // Render main answer text
    answerTxt.innerHTML = item.answer;

    // Leaderboard table, if type
    if (item.type === 'leaderboard') {
      // Insert table below answerBox, not inside it
      let container = document.createElement('div');
      container.id = leaderboardContainerId;
      container.innerHTML = buildLeaderboardTable(item.factKey, item.allRows, item.winner);
      answerBox.after(container);
    }
    // For any type with list, improve formatting
    if (item.type === 'free-from' && item.formulas && item.formulas.length > 0) {
      // Replace answerTxt with a sentence and a styled list of links
      let html = `These foods are free from ${item.question.split(' ').slice(-1)}: <ul class="fsi-list">`;
      html += item.formulas.map(r => `<li>${linkifyFormula(r)}</li>`).join('');
      html += '</ul>';
      answerTxt.innerHTML = html;
    }

    starter.style.display = 'none';
    list.style.display    = 'none';
  }

  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    clearLeaderboard();
  }

  // Input events (suggestions as you type)
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      clearLeaderboard();
      return;
    }
    starter.style.display = 'none';
    clearLeaderboard();

    // Match on triggers or keywords
    function matchItem(item) {
      return item.triggers.some(t => q.includes(t));
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
      return item.triggers.some(t => q.includes(t));
    }
    let found = suggestions.filter(matchItem);

    if (found.length) showAnswer(found[0]);
    else showAnswer({answer: 'No answer set.', type: ''});
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
}
