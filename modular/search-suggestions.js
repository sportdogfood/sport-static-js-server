import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.esm.js";

const prompts = [
  "Where is my order?",
  "What is your return policy?",
  "How can I track my shipment?",
  "How do I update my account?",
  "What food do you recommend for a puppy?",
  "Do you offer grain-free formulas?",
  "Where are you located?",
  "Can I change my shipping date?",
  "Which formula is best for German Shepherds?",
  "How do I cancel my subscription?",
  "What ingredients are in Great Plains Feast?",
  "Do you have senior dog food?",
  "What’s the feeding guideline for a 60lb dog?",
  "Where do I update my billing info?",
  "How do I use my loyalty points?",
  "What are your top selling blends?"
];

export function initSearchSuggestions() {
  const input = document.getElementById('pwr-prompt-input');
  const list = document.getElementById('pwr-suggestion-list');

  if (!input || !list) {
    console.warn('Search suggestion elements not found.');
    return;
  }

  const fuse = new Fuse(prompts, {
    includeScore: true,
    threshold: 0.4,
    distance: 60
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
      li.textContent = r.item;
      li.addEventListener('click', () => {
        input.value = r.item;
        list.style.display = 'none';
        console.log("Prompt selected:", r.item);
      });
      list.appendChild(li);
    });

    list.style.display = results.length ? 'block' : 'none';
  });
}
