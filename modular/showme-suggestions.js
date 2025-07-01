/* showme-suggestions.js */
import Fuse        from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';    // formulas across all brands
import { BRANDS }  from './br.js';    // brand definitions
import { VA_DATA } from './va.js';    // value-add definitions
import { DOG_DATA }from './dog.js';   // dog breed/group/job definitions

export function initShowmeSuggestions(faqType = '') {
  // ─── UI hookup ────────────────────────────────────────────────
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) return;

  // clear old listeners
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
    const fuse = new Fuse(suggestions, {
      keys:      ['question','keywords'],
      threshold: 0.4,
      distance:  60
    });

    freshInput.addEventListener('input', () => {
      const q = freshInput.value.trim().toLowerCase();
      list.innerHTML = '';
      freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
      if (!q) return list.hidden = true;

      const results = fuse.search(q).slice(0,5).map(r => r.item);
      if (!results.length) {
        list.appendChild(makeNoResults());
      } else {
        results.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.question;
          li.addEventListener('click', () => {
            freshInput.value = item.question;
            freshSend.style.display = freshClear.style.display = 'block';
            list.hidden = true;
          });
          list.appendChild(li);
        });
      }
      list.hidden = false;
    });

    freshClear.addEventListener('click', () => {
      freshInput.value = '';
      list.innerHTML   = '';
      list.hidden      = true;
      freshSend.style.display = freshClear.style.display = 'none';
    });

    freshInput.addEventListener('keydown', e => { if (e.key === 'Enter') freshSend.click(); });
    freshSend.addEventListener('click', () => {
      const q = freshInput.value.trim().toLowerCase();
      if (!q) return;
      const m = fuse.search(q)[0];
      if (m) {
        document.dispatchEvent(new CustomEvent('faq:suggestionSelected', { detail: m.item }));
      }
    });
  }

  // ─── Build suggestions based on faqType ───────────────────────
  let suggestions = [];

  if (faqType === 'br') {
    // Brand page
    const brandFive = document.getElementById('item-faq-five').value;
    const brandRow  = BRANDS.find(b => String(b['data-five']) === brandFive);
    if (brandRow) {
      const name = brandRow['data-brand'];
      // 1) Show each formula for this brand
      CI_DATA.filter(r => r['data-brand'] === name).forEach(r => {
        suggestions.push({
          question: `Show me ${name} ${r['data-one']}`,
          keywords: [ name.toLowerCase(), r['data-one'].toLowerCase() ],
          type: 'showme-formula',
          answer: ''
        });
      });
      // 2) Show diet filters for this brand
      [...new Set(
        CI_DATA
          .filter(r => r['data-brand'] === name && r['data-diet'])
          .map(r => r['data-diet'])
      )].forEach(diet => {
        suggestions.push({
          question: `Show me all ${name} ${diet}-free formulas`,
          keywords: [ name.toLowerCase(), `${diet}-free` ],
          type: 'showme-diet',
          answer: ''
        });
      });
      // 3) Alternatives to the brand
      suggestions.push({
        question: `Alternatives to ${name}`,
        keywords: [ name.toLowerCase(), 'alternatives' ],
        type: 'showme-alternatives',
        answer: ''
      });
    }

  } else if (faqType === 'va') {
    // Value-add page
    const vaFive = document.getElementById('item-faq-five').value;
    const vaRow  = VA_DATA[vaFive];
    if (vaRow) {
      const vaName = vaRow.displayAs;
      // 1) Show formulas with this value-add
      CI_DATA.filter(r => (r['va-data-fives']||[]).includes(vaFive)).forEach(r => {
        suggestions.push({
          question: `Show me ${r['data-brand']} ${r['data-one']} with ${vaName}`,
          keywords: [ vaName.toLowerCase(), r['data-brand'].toLowerCase() ],
          type: 'showme-va-formula',
          answer: ''
        });
      });
      // 2) Show other value-adds
      Object.values(VA_DATA).forEach(v => {
        suggestions.push({
          question: `Show me formulas with ${v.displayAs}`,
          keywords: [ v.displayAs.toLowerCase() ],
          type: 'showme-va-category',
          answer: ''
        });
      });
    }

  } else if (faqType === 'dog') {
    // Dog page (breed/group/job)
    const dogFive = document.getElementById('item-faq-five').value;
    const dogRow  = DOG_DATA.find(d => String(d['data-five']) === dogFive);
    if (dogRow) {
      const dogName = dogRow.displayAs;
      // 1) Show formulas tagged for this dog
      CI_DATA.filter(r => (r['dog-data-fives']||[]).includes(dogFive)).forEach(r => {
        suggestions.push({
          question: `Show me ${r['data-brand']} ${r['data-one']} for ${dogName}`,
          keywords: [ dogName.toLowerCase(), r['data-brand'].toLowerCase() ],
          type: 'showme-dog-formula',
          answer: ''
        });
      });
      // 2) Show other dog categories
      Object.values(DOG_DATA).forEach(d => {
        suggestions.push({
          question: `Show me formulas suitable for ${d.displayAs}`,
          keywords: [ d.displayAs.toLowerCase() ],
          type: 'showme-dog-category',
          answer: ''
        });
      });
    }

  } else if (faqType === 'home') {
    // Home page
    // 1) Show all brands
    BRANDS.forEach(b => {
      suggestions.push({
        question: `Show me formulas by ${b['data-brand']}`,
        keywords: [ b['data-brand'].toLowerCase() ],
        type: 'showme-brand',
        answer: ''
      });
    });
    // 2) Show all value-adds
    Object.values(VA_DATA).forEach(v => {
      suggestions.push({
        question: `Show me formulas with ${v.displayAs}`,
        keywords: [ v.displayAs.toLowerCase() ],
        type: 'showme-va-category',
        answer: ''
      });
    });
    // 3) Show all dog categories
    Object.values(DOG_DATA).forEach(d => {
      suggestions.push({
        question: `Show me formulas for ${d.displayAs}`,
        keywords: [ d.displayAs.toLowerCase() ],
        type: 'showme-dog-category',
        answer: ''
      });
    });
  }

  // ─── Bind to Fuse + UI ────────────────────────────────────────
  bindFuse(suggestions);
}
