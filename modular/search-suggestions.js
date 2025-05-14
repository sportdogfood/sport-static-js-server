/* search-suggestions.js  */
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData } from './faq-data.js';

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

  // ─── filter down to just the category you want ────────────────────
  const activeFaqs = faqData.filter(item => item.faqType === faqType);
  // ────────────────────────────────────────────────────────────────

  const fuse = new Fuse(activeFaqs, {
    keys:      ['question', 'keywords'],
    threshold: 0.4,
    distance:  60
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
        });
        list.appendChild(li);
      });
    }

    list.style.display = 'block';
  });
}
