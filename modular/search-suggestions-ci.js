// search-suggestions-ci.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA }   from './ci.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';

// --- Madlib token banks (trimmed to CI needs) ---
const general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
const fact     = [
  "protein", "fat", "fiber", "moisture",
  "kcals per cup", "kcals per kg"
];
const freeKeys = ["free", "free of", "without", "no", "-free"];

// --- Utility: Pull all valid tokens per CI item ---
function getSlotTokens(row, ING_LOOKUP) {
  return {
    dataBrand: row.brandDisplay || row['data-brand'],
    dataOne:   row['data-one'],
    diet:      [row['data-diet']].filter(Boolean),
    ingredient: (row['ing-data-fives']||[]).map(f=>ING_LOOKUP[f]?.displayAs).filter(Boolean),
    general:   general,
    fact:      fact,
    free:      freeKeys,
  };
}

// --- Madlib templates for CI ---
const templates = [
  // 1. Product Contains Ingredient
  {
    name: "ingredient-contains",
    slots: ["dataBrand", "dataOne", "ingredient"],
    render: c => `Does ${c.dataBrand} ${c.dataOne} contain ${c.ingredient}?`
  },
  // 2. Product Free-of (dietary)
  {
    name: "free-of",
    slots: ["dataBrand", "dataOne", "diet"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} ${c.diet.toLowerCase()}?`
  },
  // 3. Fact: What is [X]?
  {
    name: "fact-pct",
    slots: ["dataBrand", "dataOne", "fact"],
    render: c => `What is ${c.dataBrand} ${c.dataOne} ${c.fact}?`
  },
  // 4. Fact: How many [X] in product?
  {
    name: "fact-howmany",
    slots: ["dataBrand", "dataOne", "fact"],
    render: c => `How many ${c.fact} in ${c.dataBrand} ${c.dataOne}?`
  },
];

// --- Suggestion builder ---
function buildSuggestions(row, ING_LOOKUP) {
  const slots = getSlotTokens(row, ING_LOOKUP);
  const suggestions = [];

  // 1. Ingredient contains
  slots.ingredient.forEach(ingredient => {
    suggestions.push({
      question: `Does ${slots.dataBrand} ${slots.dataOne} contain ${ingredient}?`,
      keywords: [ingredient.toLowerCase()],
      type: 'ingredient-contains',
      answer: ''
    });
  });

  // 2. Free-of
  slots.diet.forEach(diet => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} ${diet.toLowerCase()}?`,
      keywords: [diet.toLowerCase()],
      type: 'free-of',
      answer: ''
    });
  });

  // 3. Facts
  fact.forEach(f => {
    suggestions.push({
      question: `What is ${slots.dataBrand} ${slots.dataOne} ${f}?`,
      keywords: [f.toLowerCase()],
      type: 'fact-pct',
      answer: ''
    });
    suggestions.push({
      question: `How many ${f} in ${slots.dataBrand} ${slots.dataOne}?`,
      keywords: [f.toLowerCase()],
      type: 'fact-howmany',
      answer: ''
    });
  });

  return suggestions;
}

// --- Main init function ---
export function initSearchSuggestionsCI(itemId) {
  const input   = document.getElementById('pwr-prompt-input');
  const list    = document.getElementById('pwr-suggestion-list');
  const starter = document.getElementById('pwr-initial-suggestions');
  const sendBtn = document.getElementById('pwr-send-button');
  const clearBtn= document.getElementById('pwr-clear-button');
  const answerBox = document.getElementById('pwr-answer-output');
  const answerTxt = document.getElementById('pwr-answer-text');

  // Compose ingredient lookup
  const ING_LOOKUP = Object.assign({}, ING_ANIM, ING_PLANT, ING_SUPP);

  // Find CI item
  const row = CI_DATA.find(r => String(r['data-five']) === String(itemId));
  if (!row) return;

  // Build suggestions for this product
  const suggestions = buildSuggestions(row, ING_LOOKUP);

  // Fuse instance
  const fuse = new Fuse(suggestions, { keys: ['question', 'keywords'], threshold: 0.4, distance: 60 });

  // Pills
  function renderStarter() {
    starter.innerHTML = '';
    suggestions
      .slice(0,5)
      .forEach(sugg => {
        const btn = document.createElement('button');
        btn.className = 'pwr-suggestion-pill';
        btn.textContent = sugg.question;
        btn.onclick = () => {
          input.value = sugg.question;
          list.style.display = 'none';
          starter.style.display = 'none';
        };
        starter.appendChild(btn);
      });
    starter.style.display = 'flex';
  }

  // Typeahead
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (!val) {
      starter.style.display = 'flex';
      list.style.display = 'none';
      return;
    }
    starter.style.display = 'none';
    list.innerHTML = '';
    const results = fuse.search(val).slice(0, 5);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      list.appendChild(li);
    } else {
      results.forEach(res => {
        const li = document.createElement('li');
        li.textContent = res.item.question;
        li.onclick = () => {
          input.value = res.item.question;
          list.style.display = 'none';
        };
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  // Send (show answer)
  sendBtn.onclick = () => {
    const val = input.value.trim();
    if (!val) return;
    const found = fuse.search(val)[0];
    answerBox.style.display = 'block';
    answerTxt.textContent = found ? found.item.answer || "Answer logic here (integrate as needed)." : "No answer available.";
    starter.style.display = 'none';
    list.style.display = 'none';
  };

  clearBtn.onclick = () => {
    input.value = '';
    answerBox.style.display = 'none';
    list.style.display = 'none';
    starter.style.display = 'flex';
  };

  renderStarter();
}
