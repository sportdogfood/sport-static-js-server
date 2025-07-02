// search-suggestions-si.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

// --- Madlib token banks (as described) ---
const general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
const foodAlt  = ["kibble", "dog food", "dry dog food", "dog food for"];
const altAdj   = ["best", "top", "premium", "recommended"];
const altVerb  = ["for", "to", "with", "without", "contain"];
const fact     = [
  "protein", "fat", "fiber", "moisture", "kcals per cup", "kcals per kg",
  "omega 6 fatty acids", "omega 3 fatty acids", "animal protein",
  "ash", "calcium", "vitamin d3", "vitamin e", "vitamin b12"
];
const freeKeys = ["free", "free of", "without", "no"];

// --- Helper: build all possible questions for each SI formula ---
function buildQuestions(siItem, ingMap) {
  const questions = [];

  // Basic nutrition/fact
  fact.forEach(fk => {
    if (siItem[`ga_${fk.replace(/\s/g, '_')}`] != null || siItem[`ga_${fk.replace(/ /g, '_')}_%`] != null) {
      questions.push({
        question: `What is ${siItem['data-brand']} ${siItem['data-one']} ${fk}?`,
        answer:   `${fk.charAt(0).toUpperCase() + fk.slice(1)} for ${siItem['data-brand']} ${siItem['data-one']} is ${siItem[`ga_${fk.replace(/\s/g, '_')}`] || siItem[`ga_${fk.replace(/ /g, '_')}_%`]}.`,
        keywords: [fk, ...general],
        itemId:   siItem.itemId
      });
      questions.push({
        question: `How many ${fk} in ${siItem['data-brand']} ${siItem['data-one']}?`,
        answer:   `There are ${siItem[`ga_${fk.replace(/\s/g, '_')}`] || siItem[`ga_${fk.replace(/ /g, '_')}_%`]} ${fk} in ${siItem['data-brand']} ${siItem['data-one']}.`,
        keywords: [fk, "how many"],
        itemId:   siItem.itemId
      });
    }
  });

  // Ingredient "contain"
  (siItem['ing-data-fives']||[]).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing) return;
    questions.push({
      question: `Does ${siItem['data-brand']} ${siItem['data-one']} contain ${ing.displayAs}?`,
      answer:   `Yes, ${siItem['data-brand']} ${siItem['data-one']} contains ${ing.displayAs}.`,
      keywords: [ing.displayAs.toLowerCase(), "contain", ...general],
      itemId:   siItem.itemId
    });
  });

  // Ingredient "not contain"
  (siItem['not-data-fives']||[]).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing) return;
    questions.push({
      question: `Does ${siItem['data-brand']} ${siItem['data-one']} contain ${ing.displayAs}?`,
      answer:   `No, ${siItem['data-brand']} ${siItem['data-one']} does not contain ${ing.displayAs}.`,
      keywords: [ing.displayAs.toLowerCase(), "free", "without", ...freeKeys, ...general],
      itemId:   siItem.itemId
    });
  });

  // “Free-of” logic
  if (siItem['data-legumes']) {
    questions.push({
      question: `Is ${siItem['data-brand']} ${siItem['data-one']} legumes-free?`,
      answer:   `Yes, ${siItem['data-brand']} ${siItem['data-one']} is legumes-free.`,
      keywords: ["legumes-free", "legume", ...freeKeys],
      itemId:   siItem.itemId
    });
  }
  if (siItem['data-poultry']) {
    questions.push({
      question: `Is ${siItem['data-brand']} ${siItem['data-one']} poultry-free?`,
      answer:   `Yes, ${siItem['data-brand']} ${siItem['data-one']} is poultry-free.`,
      keywords: ["poultry-free", "poultry", ...freeKeys],
      itemId:   siItem.itemId
    });
  }
  if (siItem['data-diet']) {
    questions.push({
      question: `Is ${siItem['data-brand']} ${siItem['data-one']} ${siItem['data-diet']}-free?`,
      answer:   `Yes, ${siItem['data-brand']} ${siItem['data-one']} is ${siItem['data-diet']}-free.`,
      keywords: [siItem['data-diet'].toLowerCase(), ...freeKeys],
      itemId:   siItem.itemId
    });
  }

  // Value-add, superlatives, “best for”
  altAdj.forEach(adj => {
    foodAlt.forEach(alt => {
      questions.push({
        question: `What is the ${adj} ${alt} for ${siItem['data-one']}?`,
        answer:   `Sport Dog Food's ${siItem['data-one']} is a ${adj} ${alt} option.`,
        keywords: [adj, alt, siItem['data-one'], ...general],
        itemId:   siItem.itemId
      });
    });
  });

  return questions;
}

export function initSearchSuggestions() {
  // DOM hooks
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  const closeX   = answerBox.querySelector('.pwr-answer-close');

  // Build ingredient map
  const ingMap = {...ING_ANIM, ...ING_PLANT, ...ING_SUPP};

  // Build all SI questions for all products
  let allQuestions = [];
  SI_DATA.forEach(si => {
    allQuestions.push(...buildQuestions(si, ingMap));
  });

  // Fuse instance
  const fuse = new Fuse(allQuestions, {
    keys: ['question', 'keywords'],
    threshold: 0.38,
    distance: 60,
  });

  // Show/hide buttons
  function showBtns() { sendBtn.style.display = 'block'; clearBtn.style.display = 'block'; }
  function hideBtns() { sendBtn.style.display = 'none';  clearBtn.style.display = 'none';  }

  // Show answer output
  function showAnswer(text) {
    answerTxt.textContent = '';
    answerBox.style.display = 'block';
    answerTxt.textContent = text;
    starter.style.display = 'none';
    list.style.display    = 'none';
  }

  // Reset all UI
  function resetAll() {
    input.value = '';
    hideBtns();
    list.style.display    = 'none';
    starter.style.display = 'flex';
    answerBox.style.display = 'none';
  }

  // Render starter pills (random 5)
  function renderStarter() {
    starter.innerHTML = '';
    allQuestions
      .slice().sort(()=>Math.random()-0.5).slice(0,5)
      .forEach(item => {
        const a = document.createElement('button');
        a.className = 'pwr-suggestion-pill';
        a.textContent = item.question;
        a.addEventListener('click', () => {
          input.value = item.question;
          showBtns();
          showAnswer(item.answer);
        });
        starter.appendChild(a);
      });
    starter.style.display = 'flex';
  }

  // Search: update suggestions on input
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    if (!q) {
      hideBtns();
      starter.style.display = 'flex';
      return list.style.display = 'none';
    }
    showBtns();
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
        li.addEventListener('click', () => {
          input.value = item.question;
          showBtns();
          showAnswer(item.answer);
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  // Clear/reset
  clearBtn.addEventListener('click', resetAll);
  closeX.addEventListener('click', resetAll);

  // Enter/Send
  sendBtn.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    const match = fuse.search(q)[0];
    if (match) showAnswer(match.item.answer);
    else showAnswer('No answer found for that.');
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // Init UI
  hideBtns();
  renderStarter();
  answerBox.style.display = 'none';
}
