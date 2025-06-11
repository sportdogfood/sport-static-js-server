<script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"></script>

<script type="importmap">
  {
    "imports": {
      "./faq-data.js": "https://git.sportdogfood.com/modular/faq-data.js",
      "./product-specs.js": "https://git.sportdogfood.com/modular/product-specs.js",
      "./doesNotContain.js": "https://git.sportdogfood.com/modular/doesNotContain.js"
    }
  }
</script>

<script type="module">
import Fuse                 from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData }          from './faq-data.js';
import { productSpecs }     from './product-specs.js';
import { doesNotContain }   from './doesNotContain.js';

// === DOM elements ===
const $       = id => document.getElementById(id);
const input   = $('pwr-prompt-input');
const send    = $('pwr-send-button');
const clear   = $('pwr-clear-button');
const list    = $('pwr-suggestion-list');
const box     = $('pwr-answer-output');
const txt     = $('pwr-answer-text');
const x       = box.querySelector('.pwr-answer-close') || $('pwr-answer-clear');
const starter = $('pwr-initial-suggestions');
const hiddenInput = $('item-faq-type');
const toolsDropupWrapper = document.querySelector('.pwr-tools-dropup-wrapper');

let fuse;
let filteredFaqs = faqData;

// --- Fade-in utility ---
function staggerFadeIn(selector) {
  const items = document.querySelectorAll(selector);
  items.forEach((el, idx) => {
    el.style.animationDelay = (0.03 * idx) + 's';
  });
}

// === UI helpers ===
const showBtns  = () => { if(send) send.style.display = 'block'; if(clear) clear.style.display = 'block'; };
const hideBtns  = () => { if(send) send.style.display = 'none'; if(clear) clear.style.display = 'none'; };

const showAns = t => {
  txt.textContent = '';
  box.style.display = 'block';
  new window.Typed(txt, {strings: [t], typeSpeed: 18, showCursor: false});
  if (starter) starter.style.display = 'none';
  if (list) list.style.display = 'none';
};

const clearAns = () => {
  box.style.display = 'none';
  txt.textContent = '';
  if (starter) starter.style.display = 'flex';
};

const resetAll  = () => {
  if(input) input.value = '';
  hideBtns();
  if(list) list.style.display = 'none';
  if(starter) starter.style.display = 'flex';
  clearAns();
};

// === Starter Pills ===
function renderStarterPills() {
  if(!starter) return;
  starter.innerHTML = '';
  // Get 5 random unique items
  const randomPills = filteredFaqs
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 5)
    .map(({ item }) => item);

  randomPills.forEach(item => {
    const a = document.createElement('a');
    a.href        = item.faqLink || '#';
    a.textContent = item.question;
    a.className   = 'pwr-suggestion-pill';
    a.addEventListener('click', e => {
      e.preventDefault();
      if(input) input.value = item.question;
      showBtns();
      if(list) list.style.display = 'none';
    });
    starter.appendChild(a);
  });
  starter.style.display = 'flex';
  staggerFadeIn('.pwr-suggestion-pill'); // <- Fade-in here
}

// === Filtering (now supports product dynamic entries) ===
function updateFilter(value) {
  const productTypes = productSpecs.map(p => p.faqType); // Get all product keys (e.g., cub, dock, herding, etc.)
  if (value === 'all') {
    filteredFaqs = faqData;
  } else if (value === 'support') {
    filteredFaqs = faqData.filter(i => i.faqType==='support');
  } else if (value === 'product-all') {
    filteredFaqs = faqData.filter(i => i.faqType!=='support');
  } else if (productTypes.includes(value)) {
    // --- PRODUCT LOGIC HERE ---
    const activeFaqs = faqData.filter(item => item.faqType === value);
    const thisProduct = productSpecs.find(p => p.faqType === value);
    let dynamicEntries = [];
    if (thisProduct) {
      // DOES contain
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
          faqType: value,
          type: 'ingredient-contains'
        });
      });
      // Does NOT contain
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
          faqType: value,
          type: 'ingredient-not-contains'
        });
      });
    }
    filteredFaqs = [...activeFaqs, ...dynamicEntries];
  } else {
    // fallback: filter by value as faqType
    filteredFaqs = faqData.filter(i => i.faqType===value);
  }

  resetAll();
  initFuseAndPills();
  if(hiddenInput) hiddenInput.value = value;
}
window.updateFilter = updateFilter; // Expose for dropup JS

function initFuseAndPills() {
  fuse = new Fuse(filteredFaqs, { keys:['question','keywords'], threshold:0.4, distance:60 });
  renderStarterPills();
}

// === Initial filter from hidden input ===
let detectedType = (hiddenInput && hiddenInput.value) || 'all';
updateFilter(detectedType);

// === Live typeahead ===
if(input) input.addEventListener('input', () => {
  const q = input.value.trim();
  clearAns(); showBtns();
  if (!q) { if(list) list.style.display='none'; if(starter) starter.style.display='flex'; return; }

  const results = fuse.search(q).slice(0,5);
  list.innerHTML = '';
  if (!results.length) {
    const li = document.createElement('li'); li.className='no-results'; li.textContent='No results found'; list.appendChild(li);
  } else {
    results.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r.item.question;
      li.addEventListener('click', () => {
        input.value = r.item.question;
        showBtns(); list.style.display='none';
      });
      list.appendChild(li);
    });
  }
  list.style.display = 'block';
  if(starter) starter.style.display = 'none';
  staggerFadeIn('#pwr-suggestion-list li'); // <--- Live fade-in
});

// === Send answer (uses Typed.js animation) ===
if(send) send.addEventListener('click', () => {
  const q = input.value.trim();
  if (!q) return;
  const f = fuse.search(q);
  if (f.length) return showAns(f[0].item.answer || f[0].item.desc || f[0].item.body || f[0].item.details || 'Found a result, but no answer text was set.');
  showAns('Could not find an answer for that.');
});

// === Clear ===
if(clear) clear.addEventListener('click', resetAll);
if(x)     x.addEventListener('click', resetAll);
if(input) input.addEventListener('keydown', e => { if (e.key==='Enter') send.click(); });

// === Dropup integration ===
if(hiddenInput && toolsDropupWrapper && hiddenInput.value) {
  toolsDropupWrapper.style.display = 'none';
}
</script>
