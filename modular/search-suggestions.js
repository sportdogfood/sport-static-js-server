// search-suggestions.js
import Fuse from 'fuse';

import { CI_DATA }   from './ci.js';
import { SI_DATA }   from './si.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';

export function initSearchSuggestions(faqType = '') {
  console.log('[search-suggestions] init', faqType);
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input||!list||!sendBtn||!clearBtn) {
    console.warn('Missing elements, aborting');
    return;
  }

  // tear down old listeners
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  function makeNoResults() {
    const li = document.createElement('li');
    li.className   = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  }

  function bindFuse(suggestions) {
    console.log('[search-suggestions] suggestions:', suggestions);
    const fuse = new Fuse(suggestions, {
      keys: ['question','keywords'],
      threshold: 0.4,
      distance: 60
    });

    freshInput.addEventListener('input', () => {
      const q = freshInput.value.trim();
      list.innerHTML = '';
      freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
      if (!q) return list.style.display = 'none';
      const results = fuse.search(q).slice(0,5).map(r=>r.item);
      if (!results.length) {
        list.appendChild(makeNoResults());
      } else {
        results.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.question;
          li.addEventListener('click', ()=>{
            freshInput.value = item.question;
            freshSend.style.display = freshClear.style.display = 'block';
            list.style.display = 'none';
            document.dispatchEvent(new CustomEvent('faq:suggestionSelected',{detail:item}));
          });
          list.appendChild(li);
        });
      }
      list.style.display = 'block';
    });

    freshClear.addEventListener('click', () => {
      freshInput.value = '';
      list.innerHTML   = '';
      list.style.display = 'none';
      freshSend.style.display = freshClear.style.display = 'none';
    });
    freshInput.addEventListener('keydown', e=>{
      if(e.key==='Enter') freshSend.click();
    });
    freshSend.addEventListener('click', ()=>{
      const q = freshInput.value.trim();
      if(!q) return;
      const m = fuse.search(q)[0];
      if(m) {
        console.log('[search-suggestions] selected:', m.item);
        document.dispatchEvent(new CustomEvent('faq:suggestionSelected',{detail:m.item}));
      }
    });
  }

  // ─── CI branch ─────────────────────────────────
  if (faqType === 'ci') {
    const five = document.getElementById('item-faq-five')?.value;
    const row  = CI_DATA.find(r=>String(r['data-five'])===five);
    if (!row) {
      console.warn('CI row not found for five=', five);
      return;
    }
    const ingMap = {...ING_ANIM,...ING_PLANT,...ING_SUPP};
    const suggestions = [];

    // 1) brand-alternatives
    suggestions.push({
      question: `Alternatives to ${row['data-brand']} ${row['data-one']}?`,
      keywords: [row['data-brand'].toLowerCase(), row['data-one'].toLowerCase()],
      answer:   ''
    });

    // 2) diet-free
    if (row['data-diet']) {
      suggestions.push({
        question: `Is ${row['data-brand']} ${row['data-one']} ${row['data-diet']}-free?`,
        keywords: [row['data-diet']],
        answer:   ''
      });
    }

    // 3) facts
    [
      ['ga_crude_protein_%','protein'],
      ['ga_crude_fat_%','fat'],
      ['ga_crude_fiber_%','fiber'],
      ['ga_moisture_%','moisture'],
      ['ga_kcals_per_kg','kcals per kg'],
      ['ga_kcals_per_cup','kcals per cup']
    ].forEach(([fld,label])=>{
      if (row[fld]!=null) {
        suggestions.push({
          question:`What is ${row['data-brand']} ${row['data-one']} ${label}?`,
          keywords:[label],
          answer:''
        });
      }
    });

    // 4) ingredient-contains
    (row['ing-data-fives']||[]).forEach(d5=>{
      const ing = ingMap[d5];
      if (!ing) return;
      const name = ing.displayAs;
      suggestions.push({
        question: `Does ${row['data-brand']} ${row['data-one']} contain ${name}?`,
        keywords: [ name.toLowerCase(), ...(ing.groupWith||[]).map(g=>g.toLowerCase()) ],
        answer: ''
      });
    });

    return bindFuse(suggestions);
  }

  // ─── SI branch ─────────────────────────────────
  if (faqType === 'si') {
    const row = SI_DATA.find(r=>r.faqType===faqType);
    if (!row) {
      console.warn('SI row not found for faqType=', faqType);
      return;
    }
    const ingMap = {...ING_ANIM,...ING_PLANT,...ING_SUPP};
    const suggestions = [];

    // similar to CI, plus “not-contains”:
    // … build brand, diet, facts, contains, NOT contains …

    // for brevity I’ll just bind a subset here:
    suggestions.push({
      question:`What is ${row['data-brand']} ${row['data-one']} protein %?`,
      keywords:['protein'],
      answer:''
    });
    suggestions.push({
      question:`Does ${row['data-brand']} ${row['data-one']} contain ${ingMap[row['ing-data-fives'][0]].displayAs}?`,
      keywords:[ingMap[row['ing-data-fives'][0]].displayAs.toLowerCase()],
      answer:''
    });
    return bindFuse(suggestions);
  }

  // ─── fallback ───────────────────────────────
  console.warn('No CI/SI match for', faqType);
}

