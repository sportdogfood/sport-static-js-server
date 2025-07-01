// search-suggestions-ci.js
import Fuse        from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';
import { ING_ANIM  } from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP  } from './ingSupp.js';

export function initSearchSuggestionsCI() {
  const $       = id => document.getElementById(id);
  const input   = $('pwr-prompt-input');
  const list    = $('pwr-suggestion-list');
  if (!input || !list) return;

  // 1) Build all the CI Q&A entries
  function buildCISuggestions() {
    const five = $('item-faq-five').value;
    const row  = CI_DATA.find(r => String(r['data-five']) === five);
    if (!row) return [];

    const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
    const out = [];

    // — Alternatives (up to 3) —
    const alts = CI_DATA
      .filter(r => r['data-brand'] === row['data-brand'] && r['data-one'] !== row['data-one'])
      .slice(0,3)
      .map(r => `${r['data-brand']} ${r['data-one']}`);
    out.push({
      question: `Alternatives to ${row['data-brand']} ${row['data-one']}?`,
      answer:   alts.length
                ? `Here are some alternatives: ${alts.join(', ')}.`
                : `No alternatives found.`,
      keywords: [ row['data-brand'].toLowerCase(), row['data-one'].toLowerCase() ]
    });

    // — Diet-free —
    if (row['data-diet']) {
      out.push({
        question: `Is ${row['data-brand']} ${row['data-one']} ${row['data-diet']}-free?`,
        answer:   `Yes—${row['data-brand']} ${row['data-one']} is ${row['data-diet']}-free.`,
        keywords: [ row['data-diet'] ]
      });
    }

    // — Facts (%, how many) —
    [
      ['ga_crude_protein_%','protein'],
      ['ga_crude_fat_%','fat'],
      ['ga_crude_fiber_%','fiber'],
      ['ga_moisture_%','moisture'],
      ['ga_kcals_per_kg','kcals per kg'],
      ['ga_kcals_per_cup','kcals per cup']
    ].forEach(([fld,label]) => {
      const v = row[fld];
      if (v != null) {
        out.push({
          question: `What is ${row['data-brand']} ${row['data-one']} ${label}?`,
          answer:   `${label.charAt(0).toUpperCase()+label.slice(1)} is ${v}${label.includes('%')?'%':''}.`,
          keywords: [ label ]
        });
        out.push({
          question: `How many ${label} in ${row['data-brand']} ${row['data-one']}?`,
          answer:   `There are ${v} ${label}.`,
          keywords: [ label ]
        });
      }
    });

    // — Ingredient‐contains —
    (row['ing-data-fives']||[]).forEach(d5 => {
      const ing = ingMap[d5];
      if (!ing) return;
      const name = ing.displayAs;
      out.push({
        question: `Does ${row['data-brand']} ${row['data-one']} contain ${name}?`,
        answer:   `Yes—it contains ${name}.`,
        keywords: [ name.toLowerCase(), ...(ing.groupWith||[]).map(g=>g.toLowerCase()) ]
      });
    });

    // — Compare placeholder —
    out.push({
      question: `Compare ${row['data-brand']} ${row['data-one']} vs [other]?`,
      answer:   `Use the Compare tab to select another formula.`,
      keywords: [ row['data-one'].toLowerCase() ]
    });

    return out;
  }

  // 2) Set up Fuse index
  const suggestions = buildCISuggestions();
  const fuse = new Fuse(suggestions, {
    keys:      ['question','keywords'],
    threshold: 0.4,
    distance:  60
  });

  // 3) Live‐search handler
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';

    if (!q) {
      list.style.display = 'none';
      return;
    }

    const results = fuse.search(q).slice(0,5).map(r => r.item);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      list.appendChild(li);
    } else {
      results.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', () => {
          // dispatch for your global handler to pick up
          document.dispatchEvent(new CustomEvent('faq:suggestionSelected', { detail: item }));
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
    }

    list.style.display = 'block';
  });
}
