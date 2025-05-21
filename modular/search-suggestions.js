/* search-suggestions.js  */
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData }        from './faq-data.js';
import { productSpecs }   from './product-specs.js';
import { doesNotContain } from './doesNotContain.js';

/**
 * Initialize or update type-ahead suggestions for a given filter context.
 * @param {string} faqType - e.g. 'all', 'support', 'cub', 'dock', 'herding', etc.
 */
export function initSearchSuggestions(faqType = 'all') {
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) {
    return console.warn('❗ Missing search-suggestion nodes');
  }

  // Remove old event listeners (prevent stacking listeners)
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  // Now reselect elements
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  // Helper: get current suggestion dataset by filter
  let allSuggestions = [];

  if (faqType === 'all') {
    allSuggestions = faqData;
  } else if (faqType === 'support') {
    allSuggestions = faqData.filter(item => item.faqType === 'support');
  } else if (faqType === 'product-all') {
    allSuggestions = faqData.filter(item => item.faqType !== 'support');
  } else {
    // Product-specific logic
    // 1. All faqs for the type
    const activeFaqs = faqData.filter(item => item.faqType === faqType);
    // 2. The matching product
    const thisProduct = productSpecs.find(p => p.faqType === faqType);

    // 3. Compose dynamic Q&As for this product
    const dynamicEntries = [];
    if (thisProduct) {
      // Ingredients it DOES contain
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

      // Ingredients it does NOT contain
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
    allSuggestions = [
      ...activeFaqs,
      ...dynamicEntries
    ];
  }

  // Set up Fuse
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

  // Clear suggestions and input
  const clearUI = () => {
    list.innerHTML = '';
    list.style.display = 'none';
    freshInput.value = '';
    freshSend.style.display = freshClear.style.display = 'none';
  };

  /* type-ahead listener */
  freshInput.addEventListener('input', () => {
    const q = freshInput.value.trim();
    list.innerHTML = '';
    list.style.display = 'none';

    freshSend.style.display  = freshClear.style.display = q ? 'block' : 'none';
    if (!q) return;

    const results = fuse.search(q).slice(0, 5);
    if (results.length === 0) {
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

  // Optionally: Clear input logic
  freshClear.addEventListener('click', clearUI);

  // Optionally: Enter triggers send
  freshInput.addEventListener('keydown', e => { if (e.key === 'Enter') freshSend.click(); });
}
