document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('pwr-prompt-input');
  const list = document.getElementById('pwr-suggestion-list');
  
  if (!input || !list) return;

  const fuse = new Fuse(prompts, {
    includeScore: true,
    threshold: 0.4,
    distance: 60
  });

  input.addEventListener('input', () => {
    const query = input.value.trim();
    if (!query) {
      list.style.display = 'none';
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
        handleSelectedPrompt(r.item);
      });
      list.appendChild(li);
    });

    list.style.display = results.length ? 'block' : 'none';
  });

  function handleSelectedPrompt(text) {
    console.log('Prompt selected:', text);
    // Add additional behavior here
  }
});
