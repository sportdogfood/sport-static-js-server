/* search-suggestions.js  */
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData }          from './faq-data.js';
import { productSpecs }     from './product-specs.js';
import { doesNotContain }   from './doesNotContain.js';

/**
 * Initialize type-ahead suggestions for a specific FAQ category.
 * @param {string} faqType 
 *    e.g. 'support', 'cub', 'dock', 'herding', 'compare', 'account', etc.
 */
export function initSearchSuggestions(faqType) {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) {
    return console.warn('❗ Missing search-suggestion nodes');
  }

  // ── Gather all FAQ entries for the current type ───────────────
  const activeFaqs = faqData.filter(item => item.faqType === faqType);

  // ── Find the product for this type, if applicable ─────────────
  const thisProduct = productSpecs.find(p => p.faqType === faqType);

  // ── Compose dynamic Q&As for 'Does X contain Y?' ──────────────
  const dynamicEntries = [];
  if (thisProduct) {
    // 1. Ingredients it DOES contain
    thisProduct.contains.forEach(ing => {
      dynamicEntries.push({
        question: `Does ${thisProduct.name} contain ${ing.name}?`,
        answer: `${thisProduct.name} contains ${ing.name}.`,
        keywords: [
          ...thisProduct.keywords,
          ...ing.keywords,
          ing.name.toLowerCase(),
          ing.slug
        ],
        faqType,
        type: 'ingredient-contains'
      });
    });

    // 2. Ingredients it does NOT contain
    doesNotContain.forEach(ing => {
      dynamicEntries.push({
        question: `Does ${thisProduct.name} contain ${ing.name}?`,
        answer: `No, ${thisProduct.name} does not contain ${ing.name}.`,
        keywords: [
          ...thisProduct.keywords,
          ing.name.toLowerCase(),
          ...(ing.masterMatch || []),
          ...(ing.alternates || []),
          ing.slug
        ],
        faqType,
        type: 'ingredient-not-contains'
      });
    });
  }

  // Merge all together for search
  const allSuggestions = [
    ...activeFaqs,
    ...dynamicEntries
  ];

  // ─── Fuse.js setup ────────────────────────────────────────────
  const fuse = new Fuse(allSuggestions, {
    keys: ['question', 'keywords'],
    threshold: 0.4,
    distance: 60
  });

  /* helper: build “No results” LI */
  const makeNoResults = () => {
    const li = document.createElement('li');
    li.className = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  };

  /* type-ahead listener */
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    list.style.display = 'none';

    // show/hide buttons
    sendBtn.style.display  = clearBtn.style.display = q ? 'block' : 'none';
    if (!q) return;

    const results = fuse.search(q).slice(0, 5);
    if (results.length === 0) {
      list.appendChild(makeNoResults());
    } else {
      results.forEach(({ item }) => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', () => {
          // fill input with the chosen question
          input.value = item.question;
          sendBtn.style.display  = clearBtn.style.display = 'block';
          list.style.display = 'none';
          // Optionally show answer immediately:
          // if (item.answer) alert(item.answer);
        });
        list.appendChild(li);
      });
    }

    list.style.display = 'block';
  });
}
