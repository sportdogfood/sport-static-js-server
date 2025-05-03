import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.min.mjs';
import { faqData } from './faq-data.js';

export function initSearchSuggestions() {
  const input = document.getElementById('pwr-prompt-input');
  const list = document.getElementById('pwr-suggestion-list');
  const output = document.getElementById('pwr-answer-output');

  if (!input || !list || !output) return;

  const fuse = new Fuse(faqData, {
    keys: ['question', 'keywords'],
    threshold: 0.4,
    distance: 60,
    includeScore: true
  });

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (!query) {
      list.style.display = 'none';
      list.innerHTML = '';
      return;
    }

    const results = fuse.search(query).slice(0, 5);
    list.innerHTML = '';
    results.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r.item.question;
      li.addEventListener('click', () => {
        input.value = r.item.question;
        showAnswer(r.item.answer);
        list.style.display = 'none';
      });
      list.appendChild(li);
    });

    list.style.display = results.length ? 'block' : 'none';
  });

  function showAnswer(answer) {
    output.textContent = answer;
    output.style.display = 'block';
  }
}
