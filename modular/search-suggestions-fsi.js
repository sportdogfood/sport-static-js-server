import { SI_DATA }      from './si.js';
import { VA_AGNOSTIC }  from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

const NUTRIENT_TRIGGERS = [
  "protein", "fat", "kcals", "kcal", "calorie", "calories"
];

function buildFsiSuggestions() {
  const s = [];
  // --- AGNOSTIC SUGGESTIONS ---
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
        const formulas = va.ids.map(id => SI_DATA.find(r => String(r['data-five']) === String(id))).filter(Boolean);
        if (!formulas.length) return;
        s.push({
          type: "agnostic",
          triggers: [
            "best", "recommended", `best food for ${tagStr.toLowerCase()}`, tagStr.toLowerCase()
          ],
          question: `Best food for ${tagStr}?`,
          answer: `For ${tagStr.toLowerCase()} dogs, we recommend ${formulas.map(siLink).join(' and ')}.`
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
        const formulas = dog.ids.map(id => SI_DATA.find(r => String(r['data-five']) === String(id))).filter(Boolean);
        if (!formulas.length) return;
        s.push({
          type: "agnostic",
          triggers: [
            "best", "recommended", `best food for ${breed.toLowerCase()}`, breed.toLowerCase()
          ],
          question: `Best food for ${breed}s?`,
          answer: `For ${breed.toLowerCase()}s, we recommend ${formulas.map(siLink).join(' and ')}.`
        });
      }
    });
  }
  // --- FREE FROM SUGGESTIONS ---
  [
    { key: 'data-poultry', name: 'poultry' },
    { key: 'data-legumes', name: 'legumes' },
    { key: 'data-peas', name: 'peas' }
  ].forEach(diet => {
    const formulas = SI_DATA.filter(row => {
      const val = row[diet.key];
      if (!val) return false;
      return String(val).toLowerCase().includes('free');
    });
    if (formulas.length) {
      s.push({
        type: 'agnostic',
        triggers: [
          `free from ${diet.name}`, `without ${diet.name}`,
          `${diet.name} free`, `no ${diet.name}`, `not contain ${diet.name}`
        ],
        question: `Which foods are free from ${diet.name}?`,
        answer: `The following formulas are free from ${diet.name}: ${formulas.map(siLink).join(', ')}.`
      });
    }
  });
  // --- NUTRIENT TABLE TRIGGER ---
  s.push({
    type: 'table',
    triggers: [...NUTRIENT_TRIGGERS, "highest", "lowest"],
    question: 'Show nutrition chart',
    answer: `Here's a chart comparing protein, fat, and calories per cup for all our formulas.`,
    showTable: true
  });
  // --- FORMULA FORWARD ---
  SI_DATA.forEach(row => {
    const name = row['data-one'] || row.Name || '';
    const slug = row['Slug'] || '';
    if (!name || !slug) return;
    s.push({
      type: 'forward-si',
      triggers: [
        name.toLowerCase(),
        `show me ${name.toLowerCase()}`,
        `learn more about ${name.toLowerCase()}`
      ],
      question: `Show me ${name}`,
      answer: `Want all the details? <a href="/si/${slug}" target="_blank">See the full ${name} FAQ here</a>.`
    });
  });
  return s;
}

function siLink(row) {
  const name = row['data-one'] || row.Name || '';
  const slug = row['Slug'] || '';
  if (!name || !slug) return name;
  return `<a href="/si/${slug}" target="_blank">${name}</a>`;
}

function buildNutritionTable(siData) {
  const cols = [
    { key: 'data-one', label: 'Formula' },
    { key: 'ga_crude_protein_%', label: 'Protein %' },
    { key: 'ga_crude_fat_%', label: 'Fat %' },
    { key: 'ga_kcals_per_cup', label: 'Kcals/cup' }
  ];
  return `
    <div id="fsi-nutrition-table-wrap">
      <table class="fsi-leaderboard-table">
        <thead>
          <tr>${cols.map(col => `<th>${col.label}</th>`).join('')}<th></th></tr>
        </thead>
        <tbody>
          ${siData.map(row => `
            <tr>
              ${cols.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
              <td><a href="/si/${row['Slug'] || ''}" target="_blank">VIEW</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function initFsiSuggestions() {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  const leaderboardContainerId = 'fsi-nutrition-table-wrap';
  const suggestions = buildFsiSuggestions();

  function clearTable() {
    let el = document.getElementById(leaderboardContainerId);
    if (el && el.parentNode) el.parentNode.removeChild(el);
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

  function showAnswer(item) {
    answerTxt.innerHTML = '';
    answerBox.style.display = 'block';
    clearTable();

    answerTxt.innerHTML = item.answer;

    if (item.type === 'table' || (item.triggers && item.triggers.some(t =>
      NUTRIENT_TRIGGERS.some(nut => t.toLowerCase().includes(nut))
    ))) {
      let container = document.createElement('div');
      container.id = leaderboardContainerId;
      container.innerHTML = buildNutritionTable(SI_DATA);
      answerBox.after(container);
    }

    starter.style.display = 'none';
    list.style.display    = 'none';
  }

  function resetAll() {
    input.value = '';
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    clearTable();
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      clearTable();
      return;
    }
    starter.style.display = 'none';
    clearTable();

    const queryWords = q.split(/\s+/).filter(Boolean);
    function matchItem(item) {
      const fields = [...(item.triggers||[])];
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
      const fields = [...(item.triggers||[])];
      return queryWords.every(word =>
        fields.some(field => field === word || field.startsWith(word) || field.includes(word))
      );
    }
    let found = suggestions.filter(matchItem);
    if (found.length) showAnswer(found[0]);
    else showAnswer({answer: 'No answer set.', type: ''});
  }});
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  answerBox.style.display = 'none';
  renderStarter();
}
