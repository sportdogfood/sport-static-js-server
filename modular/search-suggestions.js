/* search-suggestions.js */
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';

// Sport-FAQ sources (unchanged)
import { faqData }        from './faq-data.js';
import { productSpecs }   from './product-specs.js';
import { doesNotContain } from './doesNotContain.js';

// Compare-Item sources (new)
import { CI_DATA }    from './ci.json';
import { BRANDS }     from './br.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

/**
 * Initialize or update type-ahead suggestions for a given filter context.
 * @param {string} faqType  e.g. 'all', 'support', 'cub', 'compare-cub-vs-dock', etc.
 */
export function initSearchSuggestions(faqType = 'all') {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) {
    return console.warn('❗ Missing search-suggestion nodes');
  }

  // Clear old listeners
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  let allSuggestions = [];

  // --- SUPPORT or SPORT-FAQ contexts (unchanged) ---
  if (faqType === 'all') {
    allSuggestions = faqData;
  } else if (faqType === 'support') {
    allSuggestions = faqData.filter(item => item.faqType === 'support');
  } else if (faqType === 'product-all') {
    allSuggestions = faqData.filter(item => item.faqType !== 'support');
  // Product-specific SPORT-FAQ
  } else if (productSpecs.some(p => p.faqType === faqType)) {
    const activeFaqs = faqData.filter(item => item.faqType === faqType);
    const thisProduct = productSpecs.find(p => p.faqType === faqType);
    const dynamicEntries = [];

    if (thisProduct) {
      // Ingredients it does contain
      thisProduct.contains.forEach(ing => {
        dynamicEntries.push({
          question: `Does ${thisProduct.name} contain ${ing.name}?`,
          answer:   `${thisProduct.name} contains ${ing.name}.`,
          keywords: [ ...thisProduct.keywords, ...ing.keywords, ing.name.toLowerCase(), ing.slug ],
          faqType,
          type: 'ingredient-contains'
        });
      });
      // Ingredients it does NOT contain
      doesNotContain.forEach(ing => {
        dynamicEntries.push({
          question: `Does ${thisProduct.name} contain ${ing.name}?`,
          answer:   `No, ${thisProduct.name} does not contain ${ing.name}.`,
          keywords: [ ...thisProduct.keywords, ing.name.toLowerCase(), ...(ing.masterMatch||[]), ...(ing.alternates||[]), ing.slug ],
          faqType,
          type: 'ingredient-not-contains'
        });
      });
    }
    allSuggestions = [ ...activeFaqs, ...dynamicEntries ];

  // --- COMPARE-ITEM context (new) ---
  } else if (faqType.startsWith('compare-')) {
    // Determine the two data-fives from the slug
    // e.g. 'compare-cub-vs-dock' → ['cub','dock']
    const [, pair] = faqType.split('compare-');
    const [aKey, bKey] = pair.split('-vs-');
    const rowA = CI_DATA.find(r => r['data-one'].toLowerCase() === aKey);
    const rowB = CI_DATA.find(r => r['data-one'].toLowerCase() === bKey);
    if (!rowA || !rowB) {
      console.warn('Compare rows missing for', faqType);
      allSuggestions = [];
    } else {
      // Build dynamic CI entries using your mad-lib templates
      const dynamicEntries = [];

      // Brand alternatives
      dynamicEntries.push({
        question: `Alternatives to ${rowA['data-brand']} ${rowA['data-one']}?`,
        answer:   `Here are some alternatives: ` +
                  CI_DATA
                    .filter(r => r['data-brand'] === rowA['data-brand'] && r['data-one'] !== rowA['data-one'])
                    .slice(0,3)
                    .map(r => `${r['data-brand']} ${r['data-one']}`)
                    .join(', ') + '.',
        keywords: [ rowA['data-brand'].toLowerCase(), rowA['data-one'].toLowerCase() ],
        faqType,
        type: 'compare-alternatives'
      });

      // Free-of checks (diet)
      [ 'legumes', 'poultry', 'grain' ].forEach(d => {
        if (rowA[`data-${d}`]) {
          dynamicEntries.push({
            question: `Is ${rowA['data-brand']} ${rowA['data-one']} ${d}-free?`,
            answer:   `Yes—${rowA['data-brand']} ${rowA['data-one']} is ${d}-free.`,
            keywords: [ d, rowA['data-brand'].toLowerCase(), rowA['data-one'].toLowerCase() ],
            faqType,
            type: 'compare-free-of'
          });
        }
      });

      // Fact % and how-many kcals
      [['protein','ga_crude_protein_%'], ['fat','ga_crude_fat_%']].forEach(([lbl, fld]) => {
        dynamicEntries.push({
          question: `${rowA['data-brand']} ${rowA['data-one']} ${lbl}%?`,
          answer:   `${lbl.charAt(0).toUpperCase()+lbl.slice(1)} % for ${rowA['data-brand']} ${rowA['data-one']} is ${rowA[fld]}%.`,
          keywords: [ lbl, rowA['data-brand'].toLowerCase(), rowA['data-one'].toLowerCase() ],
          faqType,
          type: 'compare-fact-pct'
        });
      });
      dynamicEntries.push({
        question: `How many kcals per cup in ${rowA['data-brand']} ${rowA['data-one']}?`,
        answer:   `There are ${rowA['ga_kcals_per_cup']} kcal per cup in ${rowA['data-brand']} ${rowA['data-one']}.`,
        keywords: [ 'kcals per cup', rowA['data-brand'].toLowerCase(), rowA['data-one'].toLowerCase() ],
        faqType,
        type: 'compare-kcals'
      });

      // Ingredient contains/free-of
      const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
      rowA['ing-data-fives'].forEach(d5 => {
        const entry = ingMap[d5];
        dynamicEntries.push({
          question: `Does ${rowA['data-brand']} ${rowA['data-one']} contain ${entry.displayAs}?`,
          answer:   `Yes, ${rowA['data-brand']} ${rowA['data-one']} contains ${entry.displayAs}.`,
          keywords: [ entry.displayAs.toLowerCase(), ... (entry.groupWith||[]).map(g=>g.toLowerCase()) ],
          faqType,
          type: 'compare-ingredient'
        });
      });

      // Direct compare of facts A vs B
      ['protein','fat','kcals per cup'].forEach(fact => {
        const mapField = { protein:'ga_crude_protein_%', fat:'ga_crude_fat_%', 'kcals per cup':'ga_kcals_per_cup'}[fact];
        dynamicEntries.push({
          question: `Compare ${rowA['data-brand']} ${rowA['data-one']} vs ${rowB['data-brand']} ${rowB['data-one']} ${fact}%?`,
          answer:   `${rowA['data-one']}: ${rowA[mapField]}%, ${rowB['data-one']}: ${rowB[mapField]}%.`,
          keywords: [ fact, rowA['data-one'].toLowerCase(), rowB['data-one'].toLowerCase() ],
          faqType,
          type: 'compare-direct'
        });
      });

      allSuggestions = dynamicEntries;
    }

  } else {
    // fallback: no suggestions
    allSuggestions = [];
  }

  // Initialize Fuse on the chosen dataset
  const fuse = new Fuse(allSuggestions, {
    keys: ['question', 'keywords'],
    threshold: 0.4,
    distance: 60
  });

  // Helper to build “No results” LI
  const makeNoResults = () => {
    const li = document.createElement('li');
    li.className = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  };

  // UI reset
  const clearUI = () => {
    list.innerHTML = ''; list.style.display = 'none';
    freshInput.value = '';
    freshSend.style.display = freshClear.style.display = 'none';
  };

  // === Type-ahead listener ===
  freshInput.addEventListener('input', () => {
    const q = freshInput.value.trim();
    list.innerHTML = ''; list.style.display = 'none';
    freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
    if (!q) return;
    const results = fuse.search(q).slice(0, 5);
    if (!results.length) {
      list.appendChild(makeNoResults());
    } else {
      results.forEach(({ item }) => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', () => {
          freshInput.value = item.question;
          freshSend.style.display = freshClear.style.display = 'block';
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });

  // === Clear ===
  freshClear.addEventListener('click', clearUI);

  // === Enter => Send ===
  freshInput.addEventListener('keydown', e => { if (e.key === 'Enter') freshSend.click(); });

  // === Send (answer) ===
  freshSend.addEventListener('click', () => {
    const q = freshInput.value.trim();
    if (!q) return;
    const matches = fuse.search(q);
    if (matches.length) {
      const ans = matches[0].item.answer || 'No answer available.';
      // reuse your existing Typed.js logic to show it
      showAns(ans);
    } else {
      showAns('Could not find an answer for that.');
    }
  });
}
