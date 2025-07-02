
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

export function initSearchSuggestions() {
// ---- Full Token Banks ----
const general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
const foodAlt  = ["kibble", "dog food", "dry dog food", "dry dog food with", "dog food for", "kibble for"];
const altAdj   = ["best", "top", "recommended", "premium", "customer favorite"];
const altVerb  = ["for", "to", "with", "without", "contain", "recommended for", "options for", "vet recommended", "veterinarian recommended"];
const fact     = [
  "protein", "fat", "fiber", "moisture", "kcals per cup", "kcals per kg",
  "omega 6 fatty acids", "omega 3 fatty acids", "animal protein",
  "ash", "calcium", "vitamin d3", "vitamin e", "vitamin b12"
];
const freeKeys = ["free", "free of", "without", "no"];

// ---- Utility for Formatting Facts ----
function formatFactValue(key, val) {
  if (/_%$/.test(key)) return `${val}%`;
  if (/per_cup/.test(key)) return `${val} kcals per cup`;
  if (/per_kg/.test(key)) return `${val} kcals per kg`;
  if (/lbs/.test(key)) return `${val} lbs`;
  return val;
}

// ---- Madlib Templates ----
const templates = [
  // Ingredient Contains
  {
    type: "ingredient-contains",
    slots: ["general", "dataBrand", "dataOne", "ingredient"],
    render: ctx => `${ctx.general} Does ${ctx.dataBrand} ${ctx.dataOne} contain ${ctx.ingredient}?`
  },
  // Ingredient NOT Contains
  {
    type: "ingredient-not-contains",
    slots: ["general", "dataBrand", "dataOne", "ingredient"],
    render: ctx => `${ctx.general} Does ${ctx.dataBrand} ${ctx.dataOne} contain ${ctx.ingredient}?`
  },
  // Free-of (Grain, Legumes, Poultry, etc)
  {
    type: "free-of",
    slots: ["general", "dataBrand", "dataOne", "diet"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} ${ctx.diet}-free?`
  },
  // Fact Percentages and Amounts
  {
    type: "fact",
    slots: ["general", "dataBrand", "dataOne", "factLabel", "factValue"],
    render: ctx => `${ctx.general} What is ${ctx.dataBrand} ${ctx.dataOne} ${ctx.factLabel}?`
  },
  {
    type: "fact-how-many",
    slots: ["general", "dataBrand", "dataOne", "factLabel", "factValue"],
    render: ctx => `${ctx.general} How many ${ctx.factLabel} in ${ctx.dataBrand} ${ctx.dataOne}?`
  },
  // Value Add (VA)
  {
    type: "va",
    slots: ["general", "dataBrand", "dataOne", "vaLabel"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} ${ctx.vaLabel}?`
  },
  // Breed Suitability
  {
    type: "breed-suit",
    slots: ["general", "dataBrand", "dataOne", "dogBreed"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} suitable for ${ctx.dogBreed}?`
  },
  // Dog Activity/Group/Job
  {
    type: "activity-suit",
    slots: ["general", "dataBrand", "dataOne", "activity"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} good for ${ctx.activity}?`
  },
  {
    type: "group-suit",
    slots: ["general", "dataBrand", "dataOne", "group"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} good for ${ctx.group}?`
  },
  {
    type: "job-suit",
    slots: ["general", "dataBrand", "dataOne", "job"],
    render: ctx => `${ctx.general} Is ${ctx.dataBrand} ${ctx.dataOne} suitable for ${ctx.job}?`
  }
];

// ---- Build Suggestions For SI ----
function buildSuggestions(row, ingMap) {
  let suggestions = [];
  // --- Ingredient Contains/Not Contains
  (row['ing-data-fives']||[]).forEach(d5=>{
    const ing = ingMap[d5];
    if (!ing) return;
    suggestions.push({
      type: "ingredient-contains",
      question: `Does ${row['data-brand']} ${row['data-one']} contain ${ing.displayAs}?`,
      keywords: [ing.displayAs.toLowerCase(), ...(ing.groupWith ? [ing.groupWith.toLowerCase()] : [])],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} contains ${ing.displayAs}.`
    });
  });
  (row['not-data-fives']||[]).forEach(d5=>{
    const ing = ingMap[d5];
    if (!ing) return;
    suggestions.push({
      type: "ingredient-not-contains",
      question: `Does ${row['data-brand']} ${row['data-one']} contain ${ing.displayAs}?`,
      keywords: [ing.displayAs.toLowerCase(), ...(ing.groupWith ? [ing.groupWith.toLowerCase()] : [])],
      answer: `No, ${row['data-brand']} ${row['data-one']} does not contain ${ing.displayAs}.`
    });
  });
  // --- Free-Of
  ["data-legumes","data-poultry","data-grain"].forEach(key=>{
    if (row[key]) {
      suggestions.push({
        type: "free-of",
        question: `Is ${row['data-brand']} ${row['data-one']} ${row[key]}?`,
        keywords: [row[key].replace(' Free','').toLowerCase(), "free"],
        answer: `Yes, ${row['data-brand']} ${row['data-one']} is ${row[key].toLowerCase()}.`
      });
    }
  });
  // --- Facts (Percentages and Amounts)
  fact.forEach(fk=>{
    const dataKey = Object.keys(row).find(k=>k.replace(/[_ ]+/g,'').includes(fk.replace(/[_ ]+/g,'').replace('kcalspercup','kcalspercup').replace('kcalsperkg','kcalsperkg')));
    if (dataKey && row[dataKey] !== undefined && row[dataKey] !== null) {
      const val = formatFactValue(dataKey, row[dataKey]);
      suggestions.push({
        type: "fact",
        question: `What is ${row['data-brand']} ${row['data-one']} ${fk}?`,
        keywords: [fk.toLowerCase()],
        answer: `${fk.charAt(0).toUpperCase()+fk.slice(1)} for ${row['data-brand']} ${row['data-one']} is ${val}.`
      });
      suggestions.push({
        type: "fact-how-many",
        question: `How many ${fk} in ${row['data-brand']} ${row['data-one']}?`,
        keywords: [fk.toLowerCase()],
        answer: `There are ${val} ${fk} in ${row['data-brand']} ${row['data-one']}.`
      });
    }
  });
  // --- Value Add (VA)
  (row['va-data-fives']||[]).forEach(va=>{
    suggestions.push({
      type: "va",
      question: `Is ${row['data-brand']} ${row['data-one']} ${va}?`,
      keywords: [va.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is ${va}.`
    });
  });
  // --- Breed
  (row['dogBr-fives']||[]).forEach(b=>{
    suggestions.push({
      type: "breed-suit",
      question: `Is ${row['data-brand']} ${row['data-one']} suitable for ${b}?`,
      keywords: [b.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is suitable for ${b}.`
    });
  });
  // --- Activity/Group/Job
  (row['dogKeys_ac']||[]).forEach(a=>{
    suggestions.push({
      type: "activity-suit",
      question: `Is ${row['data-brand']} ${row['data-one']} good for ${a}?`,
      keywords: [a.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is good for ${a}.`
    });
  });
  (row['dogKeys_gp']||[]).forEach(g=>{
    suggestions.push({
      type: "group-suit",
      question: `Is ${row['data-brand']} ${row['data-one']} good for ${g}?`,
      keywords: [g.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is good for ${g}.`
    });
  });
  (row['dogKeys_jb']||[]).forEach(j=>{
    suggestions.push({
      type: "job-suit",
      question: `Is ${row['data-brand']} ${row['data-one']} suitable for ${j}?`,
      keywords: [j.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is suitable for ${j}.`
    });
  });
  return suggestions;
}

// ---- Main Init Function ----
export function initSearchSuggestions() {
  // --- DOM hooks
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !sendBtn || !clearBtn) return;

  // --- Only show for SI pages (should be guarded in your markup)
  const five = document.getElementById('item-faq-five')?.value;
  const row  = SI_DATA.find(r => String(r['data-five']) === String(five));
  if (!row) return;
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  const suggestions = buildSuggestions(row, ingMap);

  // --- Fuse
  const fuse = new Fuse(suggestions, {
    keys: ['question','keywords'],
    threshold: 0.4,
    distance: 60
  });

  // --- Starter pills (5 random)
  function renderStarter() {
    starter.innerHTML = '';
    suggestions
      .map(item=>({ item, r:Math.random() }))
      .sort((a,b)=>a.r-b.r)
      .slice(0,5)
      .map(x=>x.item)
      .forEach(item=>{
        const a = document.createElement('button');
        a.className = 'pwr-suggestion-pill';
        a.textContent = item.question;
        a.addEventListener('click', e=>{
          e.preventDefault();
          input.value = item.question;
          showBtns();
          list.style.display = 'none';
          showAnswer(item.answer);
        });
        starter.appendChild(a);
      });
    starter.style.display = 'flex';
  }
  function showBtns() { sendBtn.style.display = 'block'; clearBtn.style.display = 'block'; }
  function hideBtns() { sendBtn.style.display = 'none'; clearBtn.style.display = 'none'; }
  function showAnswer(text) {
    answerTxt.textContent = '';
    answerBox.style.display = 'block';
    new window.Typed(answerTxt, { strings: [text], typeSpeed: 18, showCursor: false });
    starter.style.display = 'none';
    list.style.display    = 'none';
  }
  function resetAll() {
    input.value = '';
    hideBtns();
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
  }

  // --- Live typeahead suggestions
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    showBtns();
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';
    const results = fuse.search(q).slice(0,5).map(r=>r.item);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      li.style.pointerEvents = 'none';
      list.appendChild(li);
    } else {
      results.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', ()=>{
          input.value = item.question;
          showBtns();
          showAnswer(item.answer);
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  input.addEventListener('keydown', e => { if (e.key==='Enter') sendBtn.click(); });
  sendBtn.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    const found = fuse.search(q);
    if (found.length) showAnswer(found[0].item.answer || 'No answer set.');
    else showAnswer('No answer set.');
  });
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  // --- Initial pills
  hideBtns();
  answerBox.style.display = 'none';
  renderStarter();
}
