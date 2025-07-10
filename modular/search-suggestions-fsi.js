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
import { buildSiSuggestions } from './search-suggestions-si.js';

const FORMULA_NAMES = ["Cub", "Dock", "Herding"];
const FORMULAS = SI_DATA.filter(r => FORMULA_NAMES.includes(r['data-one']));
const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// --- Util ---
function getFormulaByName(name) {
  return FORMULAS.find(row => (row['data-one'] || '').toLowerCase() === name.toLowerCase());
}
function getFormulaSlug(row) {
  return row.Slug || (row['data-one']||"").toLowerCase();
}

// --- Table for Leaderboard (nutrition) ---
function buildNutritionTable(metricKey) {
  // Map metric to SI key
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

  // Get values, handle numeric comparison
  let rows = FORMULAS.map(row => ({
    name: row['data-one'],
    protein: row['ga_crude_protein_%'] || "",
    fat: row['ga_crude_fat_%'] || "",
    kcals: row['ga_kcals_per_cup'] || "",
    value: Number(row[key]),
    slug: getFormulaSlug(row)
  }));

  // Highlight row with max value
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
    // Find the winner
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
  // (show best result across all formulas)
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
      // fallback: show a generic result
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
