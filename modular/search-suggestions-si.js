// search-suggestions-si.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }   from './si.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';

// --- Madlib token banks (full, explicit, no omissions) ---
const general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
const foodAlt  = ["kibble", "dog food", "dry dog food", "dry food", "dog food for"];
const altAdj   = ["best", "top", "premium", "recommended", "customer favorite"];
const altVerb  = ["for", "to", "with", "without", "contain", "recommended for"];
const fact     = [
  "protein", "fat", "fiber", "moisture", "ash", "calcium",
  "omega 6 fatty acids", "omega 3 fatty acids",
  "animal protein", "kcals per cup", "kcals per kg",
  "vitamin d3", "vitamin e", "vitamin b12"
];
const freeKeys = ["free", "free of", "without", "no", "-free"];
const vaTags   = ["Upgraded Vitamins","Sensitive Stomachs","Probiotics Added",
                  "Poultry Free","Performance Minerals","Natural Antioxidants",
                  "Legumes Free","Highly Digestible","High Protein","High Fat",
                  "High Energy","Healthy Skin and Coat","Grain Inclusive",
                  "Grain Free","Calorie Dense","Balanced Nutrition","Allergy Relief","500+ kcals per cup"];

// --- Utility: Pull all valid tokens per SI item ---
function getSlotTokens(row, ING_LOOKUP) {
  return {
    dataBrand: row.brandDisplay || row['data-brand'],
    dataOne:   row['data-one'],
    breed:     (row['dogBr-fives']||[]).map(f=>f),  // will be mapped to names if needed
    activity:  (row.dogKeys_ac||"").split(',').map(x=>x.trim()).filter(Boolean),
    group:     (row.dogKeys_gp||"").split(',').map(x=>x.trim()).filter(Boolean),
    job:       (row.dogKeys_jb||"").split(',').map(x=>x.trim()).filter(Boolean),
    ingredient: (row['ing-data-fives']||[]).map(f=>ING_LOOKUP[f]?.displayAs).filter(Boolean),
    notIngredient: (row['not-data-fives']||[]).map(f=>ING_LOOKUP[f]?.displayAs).filter(Boolean),
    valueAdd: (row['va-data-fives']||[]).map(f=>vaTags[f] || f).filter(Boolean), // if mapped in ING/VA, otherwise raw
    diet: ["Grain Free","Legumes Free","Poultry Free","Peas Free","Grain Inclusive"].filter(diet=>
      ((row['data-legumes']||"").toLowerCase().includes(diet.toLowerCase())) ||
      ((row['data-poultry']||"").toLowerCase().includes(diet.toLowerCase())) ||
      ((row['data-grain']||"").toLowerCase().includes(diet.toLowerCase()))
    ),
    fact: fact,
    general: general,
    foodAlt: foodAlt,
    altAdj: altAdj,
    altVerb: altVerb,
    free: freeKeys,
  };
}

// --- Madlib templates for SI (all supported combos, never ambiguous) ---
const templates = [
  // 1. Product Contains Ingredient
  {
    name: "ingredient-contains",
    slots: ["dataBrand", "dataOne", "ingredient"],
    render: c => `Does ${c.dataBrand} ${c.dataOne} contain ${c.ingredient}?`
  },
  // 2. Product Does Not Contain Ingredient
  {
    name: "ingredient-not-contains",
    slots: ["dataBrand", "dataOne", "notIngredient"],
    render: c => `Does ${c.dataBrand} ${c.dataOne} contain ${c.notIngredient}?`
  },
  // 3. Product Free-of (dietary)
  {
    name: "free-of",
    slots: ["dataBrand", "dataOne", "diet"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} ${c.diet.toLowerCase()}?`
  },
  // 4. Value Add Mention
  {
    name: "value-add",
    slots: ["dataBrand", "dataOne", "valueAdd"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} ${c.valueAdd}?`
  },
  // 5. Fact: What is [X]?
  {
    name: "fact-pct",
    slots: ["dataBrand", "dataOne", "fact"],
    render: c => `What is ${c.dataBrand} ${c.dataOne} ${c.fact}?`
  },
  // 6. Fact: How many [X] in product?
  {
    name: "fact-howmany",
    slots: ["dataBrand", "dataOne", "fact"],
    render: c => `How many ${c.fact} in ${c.dataBrand} ${c.dataOne}?`
  },
  // 7. Breed-specific suitability
  {
    name: "breed-suitability",
    slots: ["dataBrand", "dataOne", "breed"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} suitable for ${c.breed}?`
  },
  // 8. Activity-specific suitability
  {
    name: "activity-suitability",
    slots: ["dataBrand", "dataOne", "activity"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} good for ${c.activity}?`
  },
  // 9. Group-specific suitability
  {
    name: "group-suitability",
    slots: ["dataBrand", "dataOne", "group"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} good for ${c.group}?`
  },
  // 10. Job-specific suitability
  {
    name: "job-suitability",
    slots: ["dataBrand", "dataOne", "job"],
    render: c => `Is ${c.dataBrand} ${c.dataOne} suitable for ${c.job}?`
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
      answer: '' // will be filled later
    });
  });

  // 2. Ingredient does not contain
  slots.notIngredient.forEach(ingredient => {
    suggestions.push({
      question: `Does ${slots.dataBrand} ${slots.dataOne} contain ${ingredient}?`,
      keywords: [ingredient.toLowerCase()],
      type: 'ingredient-not-contains',
      answer: '' // will be filled later
    });
  });

  // 3. Free-of
  slots.diet.forEach(diet => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} ${diet.toLowerCase()}?`,
      keywords: [diet.toLowerCase()],
      type: 'free-of',
      answer: ''
    });
  });

  // 4. Value Add
  slots.valueAdd.forEach(va => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} ${va}?`,
      keywords: [va.toLowerCase()],
      type: 'value-add',
      answer: ''
    });
  });

  // 5. Facts
  fact.forEach(f => {
    // What is...
    suggestions.push({
      question: `What is ${slots.dataBrand} ${slots.dataOne} ${f}?`,
      keywords: [f.toLowerCase()],
      type: 'fact-pct',
      answer: ''
    });
    // How many...
    suggestions.push({
      question: `How many ${f} in ${slots.dataBrand} ${slots.dataOne}?`,
      keywords: [f.toLowerCase()],
      type: 'fact-howmany',
      answer: ''
    });
  });

  // 6. Breed suitability
  slots.breed.forEach(breed => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} suitable for ${breed}?`,
      keywords: [breed.toLowerCase()],
      type: 'breed-suitability',
      answer: ''
    });
  });

  // 7. Activity suitability
  slots.activity.forEach(activity => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} good for ${activity}?`,
      keywords: [activity.toLowerCase()],
      type: 'activity-suitability',
      answer: ''
    });
  });

  // 8. Group suitability
  slots.group.forEach(group => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} good for ${group}?`,
      keywords: [group.toLowerCase()],
      type: 'group-suitability',
      answer: ''
    });
  });

  // 9. Job suitability
  slots.job.forEach(job => {
    suggestions.push({
      question: `Is ${slots.dataBrand} ${slots.dataOne} suitable for ${job}?`,
      keywords: [job.toLowerCase()],
      type: 'job-suitability',
      answer: ''
    });
  });

  return suggestions;
}

// --- Main init function ---
export function initSearchSuggestionsSI(itemId) {
  const input   = document.getElementById('pwr-prompt-input');
  const list    = document.getElementById('pwr-suggestion-list');
  const starter = document.getElementById('pwr-initial-suggestions');
  const sendBtn = document.getElementById('pwr-send-button');
  const clearBtn= document.getElementById('pwr-clear-button');
  const answerBox = document.getElementById('pwr-answer-output');
  const answerTxt = document.getElementById('pwr-answer-text');

  // Compose ingredient lookup
  const ING_LOOKUP = Object.assign({}, ING_ANIM, ING_PLANT, ING_SUPP);

  // Find SI item
  const row = SI_DATA.find(r => String(r['data-five']) === String(itemId));
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
