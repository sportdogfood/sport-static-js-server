import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }      from './si.js';
import { ING_ANIM }     from './ingAnim.js';
import { ING_PLANT }    from './ingPlant.js';
import { ING_SUPP }     from './ingSupp.js';
import { VA_DATA }      from './va.js';
import { DOG_DATA }     from './dog.js';
import { VA_AGNOSTIC }  from './vaAgn.js';
import { DOG_AGNOSTIC } from './dogAgn.js';

const FORMULA_NAMES = ["Cub", "Dock", "Herding"];
const FORMULAS = SI_DATA.filter(r => FORMULA_NAMES.includes(r['data-one']));
const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// --- helper to build inline formula links ---
function linkify(ids) {
  // Accepts array of SI data-five, returns Cub, Dock, Herding as links
  return ids
    .map((id, i, arr) => {
      const row = SI_DATA.find(r => String(r['data-five']) === String(id));
      if (!row) return '';
      const name = row['data-one'] || row.Name || id;
      const slug = row.Slug || (name || '').toLowerCase();
      return `<a href="/item-profiles/${slug}" target="_blank" style="color:inherit;font-weight:bold;text-decoration:underline;">${name}</a>`;
    })
    .filter(Boolean)
    .map((s, i, arr) =>
      arr.length > 2 && i === arr.length - 1 ? 'and ' + s
      : arr.length > 1 && i === arr.length - 1 ? 'and ' + s
      : s
    )
    .join(arr => arr.length > 2 ? ', ' : ' ');
}

// --- build leaderboard table for highest/lowest queries ---
function buildNutritionTable(metricKey, highOrLow = "high") {
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
    slug: row.Slug || (row['data-one']||"").toLowerCase()
  }));
  // Find winner (highest or lowest)
  let winnerVal = (highOrLow === "low")
    ? Math.min(...rows.map(r => isNaN(r.value) ? Infinity : r.value))
    : Math.max(...rows.map(r => isNaN(r.value) ? -Infinity : r.value));
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
          <tr${r.value === winnerVal ? ' style="background:#262a3a;font-weight:700;"' : ''}>
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

// --- Build all possible FSI suggestion objects (deduped by question) ---
function buildFsiSuggestions() {
  const starters = [];

  // 1. Leaderboard "highest"/"lowest"
  [
    { key: "ga_crude_protein_%", label: "Highest protein?" },
    { key: "ga_crude_fat_%", label: "Highest fat?" },
    { key: "ga_kcals_per_cup", label: "Highest calories?" },
    { key: "ga_crude_protein_%", label: "Lowest protein?", low: true },
    { key: "ga_crude_fat_%", label: "Lowest fat?", low: true },
    { key: "ga_kcals_per_cup", label: "Lowest calories?", low: true }
  ].forEach(m => {
    if (FORMULAS.some(f => f[m.key])) starters.push({ type: "leaderboard", metric: m.key, label: m.label, low: !!m.low });
  });

  // 2. Show me formula
  FORMULAS.forEach(row => {
    if (row['data-one']) starters.push({ type: "show", formula: row['data-one'], label: `Show me ${row['data-one']}` });
  });

  // 3. Agnostic "best for" VA
  if (Array.isArray(VA_AGNOSTIC)) {
    VA_AGNOSTIC.forEach(va => {
      if (va && typeof va.tag === "string" && va.tag.trim() && Array.isArray(va.ids)) {
        starters.push({ type: "agnostic", vaTag: va.tag, ids: va.ids, label: `Best food for ${va.tag.replace(/-/g, ' ')}` });
      }
    });
  }

  // 4. Agnostic "best for" Dog
  if (Array.isArray(DOG_AGNOSTIC)) {
    DOG_AGNOSTIC.forEach(dog => {
      if (dog && typeof dog.breed === "string" && dog.breed.trim() && Array.isArray(dog.ids)) {
        starters.push({ type: "agnostic", dogTag: dog.breed, ids: dog.ids, label: `Best food for ${dog.breed.replace(/-/g, ' ')}` });
      }
    });
  }

  // 5. "Free from" (poultry, legumes, peas)
  FORMULAS.forEach(row => {
    ["data-legumes","data-poultry","data-grain"].forEach(key => {
      if (row[key]) {
        const diet = row[key].replace(/ Free|-free|free/gi, '').trim();
        if (diet)
          starters.push({ type: "diet", diet, formula: row['data-one'], label: `${row['data-one']} is free of ${diet}` });
      }
    });
  });

  // 6. Deduplicate by label
  const seen = new Set();
  return starters.filter(s => {
    if (!s.label || seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

// --- FSI Query Handler ---
function handleFsiQuery(query) {
  const q = (query||"").toLowerCase().trim();

  // Leaderboard (highest/lowest)
  if (/\b(highest|lowest)\b.*\b(protein|fat|kcals?|calories|kcals\/cup)\b/.test(q)) {
    let metric = "kcals";
    if (/protein/.test(q)) metric = "protein";
    if (/fat/.test(q)) metric = "fat";
    if (/calories|kcals/.test(q)) metric = "kcals";
    const highOrLow = /lowest/.test(q) ? "low" : "high";
    const metricCol = metric === "protein" ? "ga_crude_protein_%" : metric === "fat" ? "ga_crude_fat_%" : "ga_kcals_per_cup";
    const winner = FORMULAS.reduce((a,b) =>
      (highOrLow === "low"
        ? Number(b[metricCol]) < Number(a[metricCol])
        : Number(b[metricCol]) > Number(a[metricCol]))
        ? b : a
    , FORMULAS[0]);
    const winnerName = winner['data-one'];
    const winnerValue = winner[metricCol];
    const unit = metric === "protein" ? "% protein"
      : metric === "fat" ? "% fat"
      : "kcals/cup";
    return `<div>${winnerName} has the ${highOrLow === "low" ? 'lowest' : 'highest'} ${metric} (${winnerValue} ${unit}) among our foods.</div>${buildNutritionTable(metric, highOrLow)}`;
  }

  // Agnostic: "best for"
  const bestForMatch = q.match(/best food for ([a-z0-9 \-]+)/);
  if (bestForMatch) {
    const tag = bestForMatch[1].replace(/\?/g, '').trim();
    let match = VA_AGNOSTIC?.find(va => va.tag && tag && va.tag.replace(/-/g," ").toLowerCase() === tag.toLowerCase());
    if (!match && DOG_AGNOSTIC)
      match = DOG_AGNOSTIC.find(dog => dog.breed && tag && dog.breed.replace(/-/g," ").toLowerCase() === tag.toLowerCase());
    if (match && Array.isArray(match.ids) && match.ids.length) {
      return `For ${tag}, we recommend ${linkify(match.ids)}.`;
    }
  }

  // Show me formula
  const showMatch = q.match(/show me (cub|dock|herding)/);
  if (showMatch) {
    const name = showMatch[1].charAt(0).toUpperCase() + showMatch[1].slice(1).toLowerCase();
    const row = FORMULAS.find(f => f['data-one'].toLowerCase() === name.toLowerCase());
    if (!row) return "No data found.";
    return `
      <div>
        <b>${row['data-one']}</b><br>
        <span>${row['short_desc'] || "No description available."}</span><br>
        <a href="/item-profiles/${row.Slug || name.toLowerCase()}" target="_blank" style="color:inherit;font-weight:bold;text-decoration:underline;">View full FAQ</a>
      </div>
    `;
  }

  // Diet "free from"
  const freeFrom = ["poultry","legumes","peas"];
  for (let diet of freeFrom) {
    if (q.includes(`${diet}-free`) || q.includes(`free of ${diet}`) || q.includes(`without ${diet}`)) {
      const formulas = FORMULAS.filter(row => {
        return Object.values(row).join(" ").toLowerCase().includes(`${diet}-free`) ||
               Object.values(row).join(" ").toLowerCase().includes(`free of ${diet}`) ||
               Object.values(row).join(" ").toLowerCase().includes(`without ${diet}`);
      });
      if (formulas.length) {
        return `All of our formulas are ${diet}-free: ${formulas.map(f =>
          `<a href="/item-profiles/${f.Slug || f['data-one'].toLowerCase()}" target="_blank" style="color:inherit;font-weight:bold;text-decoration:underline;">${f['data-one']}</a>`
        ).join(", ")}.`;
      }
    }
  }

  // If question is about specifics (ingredient, feeding, measure, etc) — redirect to SI
  if (/(does|contain|ingredient|feeding|how much|how many|measure|analysis|vitamin|mineral|omega|ash|moisture|fiber|phosphor|selenium|zinc|d3|e|b12)/.test(q)) {
    // Try to extract formula, fallback to "our formulas"
    const match = q.match(/(cub|dock|herding)/i);
    const formula = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() : null;
    const row = formula ? FORMULAS.find(f => f['data-one'] === formula) : null;
    return `Let’s take a closer look at ${formula ? formula : 'our food'}! <a href="/item-profiles/${row ? (row.Slug || formula.toLowerCase()) : ''}" target="_blank" style="color:inherit;font-weight:bold;text-decoration:underline;">View full FAQ</a>`;
  }

  // Fallback — no answer
  return 'No results found.';
}

// --- UI Setup (as SI) ---
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
      a.textContent = item.label;
      a.addEventListener('click', e => {
        e.preventDefault();
        input.value = item.label;
        list.style.display = 'none';
        showAnswer(handleFsiQuery(item.label));
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
    list.innerHTML = '';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
    list.style.display = 'none';
  }

  // Suggestion filter logic (fuzzy on label)
  function filterSuggestions(q) {
    const fuse = new Fuse(suggestions, { keys: ['label'], threshold: 0.37 });
    return fuse.search(q).map(r => r.item);
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

    const found = filterSuggestions(q);

    if (!found.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
    } else {
      found.slice(0, 7).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.label;
        li.addEventListener('click', () => {
          input.value = item.label;
          showAnswer(handleFsiQuery(item.label));
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
