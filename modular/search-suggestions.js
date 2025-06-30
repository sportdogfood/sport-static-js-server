/* search-suggestions.js */
import Fuse        from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';
import { BRANDS }  from './br.js';
import { SI_DATA } from './si.js';
import { ING_ANIM }  from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP }  from './ingSupp.js';

export function initSearchSuggestions(faqType = 'all') {
  // ─── 0. Grab & reset UI nodes ───────────────────────────────
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

  // ─── 1. Static trigger-word lists ────────────────────────────
  const generalKeys = ["what","what's","is","how many","does","compare","for","food for"];
  const dietKeys    = ["grain-free","poultry-free","peas-free","legumes-free"];
  const factKeys    = [
    "protein","fat","fiber","moisture",
    "kcals per cup","kcals per kg",
    "omega 6 fatty acids","omega 3 fatty acids",
    "animal protein","ash","calcium",
    "vitamin d3","vitamin e","vitamin b12"
  ];
  const altAdj   = ["best","top","recommended","premium","customer favorite"];
  const foodAlt  = ["kibble","dog food","dry dog food","dry dog food with","dog food for","kibble for"];
  const altVerb  = [
    "for","to","with","without","contain","recommendations for","options for","vet recommended",
    "veterinarian recommended","best","recommended for"
];
  const freeKeys = [
    "free","free of","without","no", "excludes poultry","poultry free","free of poultry","with no poultry",
    "without poultry","excludes peas","peas free","free of peas","with no peas","without peas","excludes legumes",
    "legumes free","free of legumes","with no legumes","without legumes", "excludes lentils", "lentils free", 
    "free of lentils", "with no lentils", "without lentils"];

  // ─── 2. Ingredient map helper ───────────────────────────────
  const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
  function buildIngKeys(entry) {
    const base = [entry.displayAs.toLowerCase()];
    if (Array.isArray(entry.groupWith)) {
      base.push(...entry.groupWith.map(g=>g.toLowerCase()));
    }
    return Array.from(new Set(base));
  }

  // ─── 3. Define mad-lib templates ────────────────────────────
  const CITemplates = [
    { name:"brand",      slots:["general","dataBrand","dataOne"],            render:c=>`${c.general} ${c.dataBrand} ${c.dataOne}?` },
    { name:"freeOf",     slots:["general","dataBrand","dataOne","diet"],     render:c=>`${c.general} ${c.dataBrand} ${c.dataOne} ${c.diet}-free?` },
    { name:"factPct",    slots:["dataBrand","dataOne","fact"],               render:c=>`${c.dataBrand} ${c.dataOne} ${c.fact}%?` },
    { name:"factHowMany",slots:["general","factLabel","dataBrand","dataOne"],render:c=>`${c.general} How many ${c.factLabel} in ${c.dataBrand} ${c.dataOne}?` },
    { name:"ingredient", slots:["general","dataBrand","dataOne","ingredient"],render:c=>`${c.general} ${c.dataBrand} ${c.dataOne} contain ${c.ingredient}?` },
    { name:"notContains",slots:["general","dataBrand","dataOne","sd"],        render:c=>`${c.general} ${c.dataBrand} ${c.dataOne} without ${c.sd}?` },
    { name:"compare",    slots:["general","dataBrandA","dataOneA","dataBrandB","dataOneB","fact"],
      render:c=>`${c.general} Compare ${c.dataBrandA} ${c.dataOneA} vs ${c.dataBrandB} ${c.dataOneB} ${c.fact}%?`
    }
  ];

  const SITemplates = [
    // identical to CITemplates, just pulling from SI fields
    ...CITemplates
      .map(t => ({ ...t })) // reuse same patterns
  ];

  // ─── 4. Choose context & build slotKeys + templates ─────────
  let templates = [], slotKeys = {}, baseData = null;

  if (faqType === 'ci') {
    // CI page: single formula
    const five = document.getElementById('item-faq-five').value;
    const row  = CI_DATA.find(r => r['data-five'] === five);
    baseData    = row;
    templates   = CITemplates;
    slotKeys = {
      general:   generalKeys,
      dataBrand: [row['data-brand'].toLowerCase()],
      dataOne:   [row['data-one'].toLowerCase()],
      diet:      dietKeys.filter(d=>row['data-'+d.replace(/-/g,'')]),
      fact:      factKeys,
      factLabel: factKeys,
      ingredient: row['ing-data-fives'].flatMap(d5=> buildIngKeys(ingMap[d5]||{})),
      sd:         row['not-data-fives'].flatMap(d5=> buildIngKeys(ingMap[d5]||{})),
      dataBrandA: [row['data-brand'].toLowerCase()],
      dataOneA:   [row['data-one'].toLowerCase()],
      dataBrandB: [],
      dataOneB:   []
    };
  }
  else if (faqType.startsWith('compare-')) {
    // Compare page: two formulas
    const [,, pair]  = faqType.split('compare-');
    const [aKey,bKey]= pair.split('-vs-');
    const rowA = CI_DATA.find(r=>r['data-one'].toLowerCase()===aKey);
    const rowB = CI_DATA.find(r=>r['data-one'].toLowerCase()===bKey);
    if (rowA && rowB) {
      baseData  = rowA;
      templates = CITemplates;
      slotKeys  = {
        general:   generalKeys,
        dataBrandA:[rowA['data-brand'].toLowerCase()],
        dataOneA:  [rowA['data-one'].toLowerCase()],
        dataBrandB:[rowB['data-brand'].toLowerCase()],
        dataOneB:  [rowB['data-one'].toLowerCase()],
        fact:      factKeys
      };
    }
  }
  else if (SI_DATA.some(p=>p.faqType===faqType)) {
    // SI page: sport-item
    const row = SI_DATA.find(p=>p.faqType===faqType);
    baseData    = row;
    templates   = SITemplates;
    slotKeys = {
      general:    generalKeys,
      dataBrand:  [row.brandDisplay.toLowerCase()],
      dataOne:    [row['data-one'].toLowerCase()],
      diet:       dietKeys.filter(d=>row['data-diet'].toLowerCase()===d),
      fact:       factKeys,
      factLabel:  factKeys,
      ingredient: row['ing-data-fives'].flatMap(d5=> buildIngKeys(ingMap[d5]||{})),
      sd:         row['not-data-fives'].flatMap(d5=> buildIngKeys(ingMap[d5]||{})),
      // placeholders:
      va:  (row['va-data-fives']||[]).map(_=>/* lookup in VA map */``),
      breed:(row['dogBr-fives']||[]).map(_=>/* lookup in DOG map*/``),
      dataBrandA:[row.brandDisplay.toLowerCase()],
      dataOneA:  [row['data-one'].toLowerCase()],
      dataBrandB:[],
      dataOneB:  []
    };
  }
  else {
    // no Q&A here
    templates = [];
    slotKeys  = {};
  }

  // ─── 5. Build Fuse index ──────────────────────────────────────
  const fuseIndex = [];
  templates.forEach(t => {
    t.slots.forEach(slot => {
      fuseIndex.push({
        template: t,
        slot,
        keys: slotKeys[slot] || []
      });
    });
  });
  const fuse = new Fuse(fuseIndex, {
    keys: ["keys"],
    threshold: 0.3,
    minMatchCharLength: 2
  });

  // ─── 6. Suggestion engine ────────────────────────────────────
  function suggestQuestions(txt) {
    const q = txt.trim().toLowerCase();
    let matches = fuseIndex.filter(e => e.keys.some(k=>q.includes(k)));
    if (!matches.length) matches = fuse.search(q).map(r=>r.item);
    const out = [];
    templates.forEach(t => {
      const ctx = {}, ok = t.slots.every(slot => {
        if (slot === 'general') { ctx.general = "What"; return true; }
        const m = matches.find(m=>m.template===t && m.slot===slot);
        if (m) { ctx[slot] = m.keys.find(k=>q.includes(k)); return true; }
        return false;
      });
      if (ok) out.push(t.render(ctx));
    });
    return out.length ? Array.from(new Set(out)).slice(0,3)
                     : ["Sorry, try typing protein, fat, or peas."];
  }

  // ─── 7. Wire UI ───────────────────────────────────────────────
  const makeNoResults = () => {
    const li = document.createElement('li');
    li.className = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  };

  freshInput.addEventListener('input', () => {
    const q = freshInput.value.trim();
    list.innerHTML = '';
    list.style.display = (q ? 'block' : 'none');
    freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
    if (!q) return;

    const suggestions = suggestQuestions(q);
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
      // dispatch to faq.js for answer building
      document.dispatchEvent(
        new CustomEvent('faq:suggestionSelected', { detail: match.item })
      );
    }
  });
}
