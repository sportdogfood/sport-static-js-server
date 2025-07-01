/* search-suggestions.js */
import Fuse        from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { faqData } from './faq-data.js';
import { CI_DATA } from './ci.js';
import { SI_DATA } from './si.js';
import { ING_ANIM  } from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP  } from './ingSupp.js';
import { VA_DATA   } from './va.js';
import { DOG_DATA  } from './dog.js';

export function initSearchSuggestions(faqType = 'all') {
  // ─── 0. UI hooks & remove old listeners ───────────────────────
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) {
    return console.warn('❗ Missing search-suggestion nodes');
  }
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  // ─── 1. Static trigger-word lists ─────────────────────────────
  const generalKeys = [
    "what","what's","is","how many","does","compare",
    "for","food for"
  ];
  const dietKeys = [
    "grain-free","poultry-free","peas-free","legumes-free"
  ];
  const factKeys = [
    "protein","fat","fiber","moisture",
    "kcals per cup","kcals per kg",
    "omega 6 fatty acids","omega 3 fatty acids",
    "animal protein","ash","calcium",
    "vitamin d3","vitamin e","vitamin b12"
  ];
  const altAdj = [
    "best","top","recommended","premium","customer favorite"
  ];
  const foodAlt = [
    "kibble","dog food","dry dog food",
    "dry dog food with","dog food for","kibble for"
  ];
  const altVerb = [
    "for","to","with","without","contain",
    "recommendations for","options for",
    "vet recommended","veterinarian recommended",
    "best","recommended for"
  ];
  const freeKeys = [
    "free","free of","without","no",
    "excludes poultry","poultry free","free of poultry","with no poultry","without poultry",
    "excludes peas","peas free","free of peas","with no peas","without peas",
    "excludes legumes","legumes free","free of legumes","with no legumes","without legumes",
    "excludes lentils","lentils free","free of lentils","with no lentils","without lentils"
  ];

  // ─── 2. Ingredient-key builder ───────────────────────────────
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  function buildIngKeys(entry) {
    const keys = [];
    if (entry.displayAs) {
      keys.push(entry.displayAs.toLowerCase());
    }
    if (Array.isArray(entry.groupWith)) {
      entry.groupWith.forEach(g => keys.push(g.toLowerCase()));
    }
    return Array.from(new Set(keys));
  }

  // ─── 3. Templates for CI (brand + ingredient) ────────────────
  const CITemplates = [
    {
      name: "brand",
      type: "brand",
      question: ctx => `Alternatives to ${ctx.dataBrand} ${ctx.dataOne}?`,
      keywords: ctx => [ ctx.dataBrand.toLowerCase(), ctx.dataOne.toLowerCase() ]
    },
    {
      name: "ingredient",
      type: "ingredient",
      question: ctx => `Does ${ctx.dataBrand} ${ctx.dataOne} contain ${ctx.ingredient}?`,
      keywords: ctx => [ ctx.ingredient.toLowerCase() ]
    }
  ];

  // ─── 4. Templates for SI (full Q&A) ──────────────────────────
  const SITemplates = [
    {
      name: "factPct",
      slots: ["dataBrand","dataOne","fact"],
      render: c => `${c.dataBrand} ${c.dataOne} ${c.fact}%?`
    },
    {
      name: "factHowMany",
      slots: ["general","fact","dataBrand","dataOne"],
      render: c => `${c.general} How many ${c.fact} in ${c.dataBrand} ${c.dataOne}?`
    },
    {
      name: "freeOf",
      slots: ["general","dataBrand","dataOne","diet"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} ${c.diet}-free?`
    },
    {
      name: "ingredient",
      slots: ["general","dataBrand","dataOne","ingredient"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} contain ${c.ingredient}?`
    },
    {
      name: "valueAdd",
      slots: ["general","dataBrand","dataOne","va"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} ${c.va}?`
    },
    {
      name: "breedSuit",
      slots: ["general","dataBrand","dataOne","breed"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} for ${c.breed}?`
    },
    {
      name: "activitySuit",
      slots: ["general","dataBrand","dataOne","activity"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} for ${c.activity}?`
    },
    {
      name: "groupSuit",
      slots: ["general","dataBrand","dataOne","group"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} for ${c.group}?`
    },
    {
      name: "jobSuit",
      slots: ["general","dataBrand","dataOne","job"],
      render: c => `${c.general} ${c.dataBrand} ${c.dataOne} for ${c.job}?`
    }
  ];

  // ─── 5. Helper to build “no results” LI ───────────────────────
  function makeNoResults() {
    const li = document.createElement('li');
    li.className   = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  }

  // ─── 6. Build and wire suggestions for CI & support ──────────
  let allSuggestions = [];
  if (faqType === 'all') {
    allSuggestions = faqData;
  }
  else if (faqType === 'support') {
    allSuggestions = faqData.filter(i => i.faqType === 'support');
  }
  else if (faqType === 'product-all') {
    allSuggestions = faqData.filter(i => i.faqType !== 'support');
  }
  else if (faqType === 'ci') {
    // CI page: only brand + ingredient
    const five = document.getElementById('item-faq-five').value;
    const row  = CI_DATA.find(r => r['data-five'] === five);
    if (row) {
      // brand template
      allSuggestions.push({
        question: CITemplates[0].question({ 
          dataBrand: row['data-brand'], 
          dataOne:   row['data-one'] 
        }),
        keywords: CITemplates[0].keywords({ 
          dataBrand: row['data-brand'], 
          dataOne:   row['data-one'] 
        }),
        type: 'brand',
        answer: ''
      });
      // ingredient templates
      row['ing-data-fives'].forEach(d5 => {
        const ing = ingMap[d5];
        if (!ing) return;
        buildIngKeys(ing).forEach(key => {
          allSuggestions.push({
            question: `Does ${row['data-brand']} ${row['data-one']} contain ${ing.displayAs}?`,
            keywords: [ key ],
            type: 'ingredient',
            answer: ''
          });
        });
      });
    }
  }

  if (allSuggestions.length) {
    const fuse = new Fuse(allSuggestions, {
      keys: ['question','keywords'],
      threshold: 0.4,
      distance: 60
    });

    // Live type-ahead
    freshInput.addEventListener('input', () => {
      const q = freshInput.value.trim();
      list.innerHTML = '';
      freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
      if (!q) return list.style.display = 'none';

      const results = fuse.search(q).slice(0,5);
      if (!results.length) {
        list.appendChild(makeNoResults());
      } else {
        results.forEach(({item}) => {
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

    freshClear.addEventListener('click', () => {
      freshInput.value = '';
      list.innerHTML = '';
      list.style.display = 'none';
      freshSend.style.display = freshClear.style.display = 'none';
    });

    freshInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') freshSend.click();
    });

    freshSend.addEventListener('click', () => {
      const q = freshInput.value.trim();
      if (!q) return;
      const match = fuse.search(q)[0];
      if (match) {
        document.dispatchEvent(
          new CustomEvent('faq:suggestionSelected', { detail: match.item })
        );
      }
    });
    return; // CI & support done
  }

  // ─── 7. SI branch: full Q&A mad-libs ─────────────────────────
  if (SI_DATA.some(p => p.faqType === faqType)) {
    const row = SI_DATA.find(p => p.faqType === faqType);
    // build slotKeys
    const breedKeys    = (row['dogBr-fives'] || [])
      .map(d5 => DOG_DATA[d5].displayAs.toLowerCase());
    const activityKeys = (row.dogKeys_ac || []).map(s => s.toLowerCase());
    const groupKeys    = (row.dogKeys_gp || []).map(s => s.toLowerCase());
    const jobKeys      = (row.dogKeys_jb || []).map(s => s.toLowerCase());

    const slotKeys = {
      general:    generalKeys,
      dataBrand:  [ row.brandDisplay.toLowerCase() ],
      dataOne:    [ row['data-one'].toLowerCase() ],
      diet:       dietKeys.filter(d => row['data-diet'].toLowerCase() === d),
      fact:       factKeys,
      ingredient: row['ing-data-fives'].flatMap(d5 => buildIngKeys(ingMap[d5] || {})),
      sd:         row['not-data-fives'].flatMap(d5 => buildIngKeys(ingMap[d5] || {})),
      va:         (row['va-data-fives'] || [])
                     .map(d5 => VA_DATA[d5].displayAs.toLowerCase()),
      breed:      breedKeys.length    ? breedKeys    : [ "active dogs" ],
      activity:   activityKeys.length ? activityKeys : [ "active dogs" ],
      group:      groupKeys.length    ? groupKeys    : [ "active dogs" ],
      job:        jobKeys.length      ? jobKeys      : [ "active dogs" ]
    };

    // build fuse index over SITemplates
    const fuseIndex = [];
    SITemplates.forEach(t => {
      t.slots.forEach(slot => {
        fuseIndex.push({ template: t, slot, keys: slotKeys[slot] || [] });
      });
    });
    const fuseSI = new Fuse(fuseIndex, {
      keys: ["keys"],
      threshold: 0.3,
      minMatchCharLength: 2
    });

    function suggestSI(txt) {
      const q = txt.trim().toLowerCase();
      let m = fuseIndex.filter(e => e.keys.some(k => q.includes(k)));
      if (!m.length) m = fuseSI.search(q).map(r => r.item);
      const out = [];
      SITemplates.forEach(t => {
        const ctx = {};
        const ok = t.slots.every(slot => {
          if (slot === "general") { ctx.general = "What"; return true; }
          const pick = m.find(x => x.template === t && x.slot === slot);
          if (pick) {
            ctx[slot] = pick.keys.find(k => q.includes(k));
            return true;
          }
          return false;
        });
        if (ok) out.push(t.render(ctx));
      });
      return out.length
        ? Array.from(new Set(out)).slice(0,3)
        : ["Sorry, try typing protein, fat, or peas."];
    }

    // SI: wire type-ahead like above
    freshInput.addEventListener('input', () => {
      const q = freshInput.value;
      list.innerHTML = '';
      freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
      if (!q) return list.style.display = 'none';

      const suggestions = suggestSI(q);
      if (suggestions[0].startsWith("Sorry")) {
        list.appendChild(makeNoResults());
      } else {
        suggestions.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          li.addEventListener('click', () => {
            freshInput.value = text;
            list.style.display = 'none';
          });
          list.appendChild(li);
        });
      }
      list.style.display = 'block';
    });

    freshClear.addEventListener('click', () => {
      freshInput.value = '';
      list.innerHTML   = '';
      list.style.display = 'none';
      freshSend.style.display = freshClear.style.display = 'none';
    });

    freshInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') freshSend.click();
    });

    freshSend.addEventListener('click', () => {
      const q = freshInput.value.trim();
      if (!q) return;
      const match = fuseSI.search(q)[0];
      if (match) {
        document.dispatchEvent(
          new CustomEvent('faq:suggestionSelected', { detail: match.item })
        );
      }
    });
  }
}
