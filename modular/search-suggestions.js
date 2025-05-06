/* search‑suggestions.js  */
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData } from './faq-data.js';

/* exposed so main page can call initSearchSuggestions() */
export function initSearchSuggestions() {
  const input     = document.getElementById('pwr-prompt-input');
  const list      = document.getElementById('pwr-suggestion-list');
  const sendBtn   = document.getElementById('pwr-send-button');
  const clearBtn  = document.getElementById('pwr-clear-button');

  if (!input || !list || !sendBtn || !clearBtn) return console.warn('❗ Missing search‑suggestion nodes');

  /* Fuse.js set‑up */
  const fuse = new Fuse(faqData, {
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

  /* type‑ahead listener */
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    list.style.display = 'none';

    /* toggle buttons */
    sendBtn.style.display  = clearBtn.style.display = q ? 'block' : 'none';

    if (!q) return;

    const results = fuse.search(q).slice(0, 5);

    if (results.length === 0) {
      list.appendChild(makeNoResults());
    } else {
      results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r.item.question;
        li.addEventListener('click', () => {
          /* populate input ONLY; wait for Send */
          input.value = r.item.question;
          sendBtn.style.display = clearBtn.style.display = 'block';
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
  });
}
