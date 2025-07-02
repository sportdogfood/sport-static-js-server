// search-suggestions.js (BASIC BASELINE)

// --- Imports ---
// (Change these imports for the data source you want)
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

const ING_MAP = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

// --- Utility for safe arrays ---
function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return [val];
  if (val == null) return [];
  try { return Array.from(val); } catch { return []; }
}

// --- Minimal builder for SI page ---
function buildSimpleSuggestions(row, ingMap) {
  let out = [];
  // Ingredient Contains
  safeArray(row['ing-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing) return;
    out.push({
      type: "ingredient-contains",
      question: `Does ${row['data-brand']} ${row['data-one']} contain ${ing.displayAs}?`,
      keywords: [ing.displayAs.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} contains ${ing.displayAs}.`
    });
  });
  // Ingredient Not Contains
  safeArray(row['not-data-fives']).forEach(d5 => {
    const ing = ingMap[d5];
    if (!ing) return;
    out.push({
      type: "ingredient-not-contains",
      question: `Does ${row['data-brand']} ${row['data-one']} contain ${ing.displayAs}?`,
      keywords: [ing.displayAs.toLowerCase()],
      answer: `No, ${row['data-brand']} ${row['data-one']} does not contain ${ing.displayAs}.`
    });
  });
  // Value Add (dummy if you don't have VA_DATA loaded)
  safeArray(row['va-data-fives']).forEach(va => {
    out.push({
      type: "va",
      question: `Is ${row['data-brand']} ${row['data-one']} ${va}?`,
      keywords: [va.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is ${va}.`
    });
  });
  // Breed
  safeArray(row['dogBr-fives']).forEach(b => {
    out.push({
      type: "breed-suit",
      question: `Is ${row['data-brand']} ${row['data-one']} suitable for ${b}?`,
      keywords: [b.toLowerCase()],
      answer: `Yes, ${row['data-brand']} ${row['data-one']} is suitable for ${b}.`
    });
  });
  return out;
}

// --- Main init function ---
export function initSearchSuggestions() {
  const input   = document.getElementById('pwr-prompt-input');
  const list    = document.getElementById('pwr-suggestion-list');
  const clearBtn= document.getElementById('pwr-clear-button');
  const starter = document.getElementById('pwr-initial-suggestions');
  const answerBox = document.getElementById('pwr-answer-output');
  const answerTxt = document.getElementById('pwr-answer-text');
  if (!input || !list || !clearBtn) return;

  const five = document.getElementById('item-faq-five')?.value;
  const row  = SI_DATA.find(r => String(r['data-five']) === String(five));
  if (!row) return;

  const suggestions = buildSimpleSuggestions(row, ING_MAP);

  // Just show 5 random pills
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
          list.style.display = 'none';
          showAnswer(item.answer);
        });
        starter.appendChild(a);
      });
    starter.style.display = 'flex';
  }

  function showAnswer(text) {
    answerTxt.textContent = '';
    answerBox.style.display = 'block';
    if (window.Typed) {
      new window.Typed(answerTxt, { strings: [text], typeSpeed: 18, showCursor: false });
    } else {
      answerTxt.textContent = text;
    }
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
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) {
      list.style.display = 'none';
      starter.style.display = 'flex';
      return;
    }
    starter.style.display = 'none';
    // Simple search: substring match on question or keywords
    const results = suggestions.filter(
      s => s.question.toLowerCase().includes(q) || s.keywords.some(k=>q.includes(k))
    ).slice(0,5);
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
          showAnswer(item.answer);
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  clearBtn.addEventListener('click', resetAll);
  answerBox.querySelector('.pwr-answer-close')?.addEventListener('click', resetAll);

  // Initial state
  answerBox.style.display = 'none';
  renderStarter();
}
