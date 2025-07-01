/* search-suggestions.js */
import Fuse        from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA } from './ci.js';     // CI vars: Slug, data-legumes, data-poultry, data-grain, data-five, data-one, data-brand, data-diet, specs_..., ga_...
import { SI_DATA } from './si.js';     // SI vars: same + dogBr-fives, dogKeys_ac/gp/jb, va-data-fives, not-data-fives, ga_omega_..., etc.
import { ING_ANIM  } from './ingAnim.js';
import { ING_PLANT } from './ingPlant.js';
import { ING_SUPP  } from './ingSupp.js';
import { VA_DATA   } from './va.js';
import { DOG_DATA  } from './dog.js';

export function initSearchSuggestions(faqType = '') {
  // ─── UI hooks & helper ────────────────────────────────────────
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) return;

  // clear old listeners
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  function makeNoResults() {
    const li = document.createElement('li');
    li.className   = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  }

  function bindFuse(suggestions) {
    const fuse = new Fuse(suggestions, {
      keys:      ['question','keywords'],
      threshold: 0.4,
      distance:  60
    });

    freshInput.addEventListener('input', () => {
      const q = freshInput.value.trim();
      list.innerHTML = '';
      freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
      if (!q) return list.hidden = true;

      const results = fuse.search(q).slice(0,5).map(r=>r.item);
      if (!results.length) list.appendChild(makeNoResults());
      else results.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.question;
        li.addEventListener('click', () => {
          freshInput.value = item.question;
          freshSend.style.display = freshClear.style.display = 'block';
          list.hidden = true;
        });
        list.appendChild(li);
      });
      list.hidden = false;
    });

    freshClear.addEventListener('click', () => {
      freshInput.value = '';
      list.innerHTML   = '';
      list.hidden      = true;
      freshSend.style.display = freshClear.style.display = 'none';
    });
    freshInput.addEventListener('keydown', e => { if (e.key==='Enter') freshSend.click(); });
    freshSend.addEventListener('click', () => {
      const q = freshInput.value.trim();
      if (!q) return;
      const m = fuse.search(q)[0];
      if (m) document.dispatchEvent(new CustomEvent('faq:suggestionSelected',{detail:m.item}));
    });
  }

  // ─── CI branch (“Compare” pages) ───────────────────────────────
  if (faqType === 'ci') {
    const five = document.getElementById('item-faq-five').value;
    const row  = CI_DATA.find(r => String(r['data-five']) === five);
    if (!row) return;
    const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
    const suggestions = [];

    // 1) Alternatives
    suggestions.push({
      question: `Alternatives to ${row['data-brand']} ${row['data-one']}?`,
      keywords: [ row['data-brand'].toLowerCase(), row['data-one'].toLowerCase() ],
      type: 'alternatives', answer: ''
    });

    // 2) Free-of (diet) if set
    if (row['data-diet']) {
      suggestions.push({
        question: `Is ${row['data-brand']} ${row['data-one']} ${row['data-diet']}-free?`,
        keywords: [ row['data-diet'] ],
        type: 'freeOf', answer: ''
      });
    }

    // 3) Fact lookups
    [
      ['ga_crude_protein_%','protein'],
      ['ga_crude_fat_%','fat'],
      ['ga_crude_fiber_%','fiber'],
      ['ga_moisture_%','moisture'],
      ['ga_kcals_per_kg','kcals per kg'],
      ['ga_kcals_per_cup','kcals per cup']
    ].forEach(([fld,label]) => {
      const val = row[fld];
      if (val != null) {
        suggestions.push({
          question: `What is ${row['data-brand']} ${row['data-one']} ${label}%?`,
          keywords: [ label ],
          type: 'factPct', answer:''
        });
        suggestions.push({
          question: `How many ${label} in ${row['data-brand']} ${row['data-one']}?`,
          keywords: [ label ],
          type: 'factHowMany', answer:''
        });
      }
    });

    // 4) Ingredient‐contains
    (row['ing-data-fives']||[]).forEach(d5 => {
      const ing = ingMap[d5]; if(!ing) return;
      const name = ing.displayAs;
      const keys = [ name.toLowerCase(), ...(ing.groupWith||[]).map(g=>g.toLowerCase()) ];
      suggestions.push({
        question: `Does ${row['data-brand']} ${row['data-one']} contain ${name}?`,
        keywords: keys, type:'ingredient', answer:''
      });
    });

    // 5) Compare‐placeholder (CE will augment)
    suggestions.push({
      question: `Compare ${row['data-brand']} ${row['data-one']} vs [other]?`,
      keywords: [ row['data-one'].toLowerCase() ],
      type: 'compare', answer:''
    });

    return bindFuse(suggestions);
  }

  // ─── SI branch (“Explore” pages) ───────────────────────────────
  if (faqType === 'si') {
    const row = SI_DATA.find(r => r.faqType === faqType);
    if (!row) return;
    const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

    // slot→tokens
    const generalKeys  = ["what","what's","is","does","compare","for","food for"];
    const altAdj       = ["best","top","recommended","premium","customer favorite"];
    const foodAlt      = ["kibble","dog food","dry dog food","dry dog food with","dog food for","kibble for"];
    const altVerb      = ["for","to","with","without","contain","recommendations for","options for","vet recommended","veterinarian recommended","best","recommended for"];
    const freeKeys     = ["free","free of","without","no"];
    const dietKeys     = ["grain-free","poultry-free","peas-free","legumes-free"];
    const factKeys     = ["protein","fat","fiber","moisture","kcals per cup","kcals per kg","omega 6 fatty acids","omega 3 fatty acids","animal protein","ash","calcium","vitamin d3","vitamin e","vitamin b12"];
    const breedKeys    = (row['dogBr-fives']||[]).map(d5=>DOG_DATA[d5].displayAs.toLowerCase());
    const activityKeys = (row.dogKeys_ac||[]).map(s=>s.toLowerCase());
    const groupKeys    = (row.dogKeys_gp||[]).map(s=>s.toLowerCase());
    const jobKeys      = (row.dogKeys_jb||[]).map(s=>s.toLowerCase());
    const sdKeys       = (row['not-data-fives']||[]).flatMap(d5=>{
      const ing = ingMap[d5]; return ing? [ing.displayAs.toLowerCase()] : [];
    });
    const vaKeys       = (row['va-data-fives']||[]).map(d5=>VA_DATA[d5].displayAs.toLowerCase());
    const ingKeys      = (row['ing-data-fives']||[]).flatMap(d5=>{
      const ing=ingMap[d5]; return ing? [ing.displayAs.toLowerCase(), ...(ing.groupWith||[]).map(g=>g.toLowerCase())] : [];
    });

    // fallbacks
    if (!breedKeys.length)    breedKeys.push('active dogs');
    if (!activityKeys.length) activityKeys.push('active dogs');
    if (!groupKeys.length)    groupKeys.push('active dogs');
    if (!jobKeys.length)      jobKeys.push('active dogs');

    const slotTokens = {
      general:    [...generalKeys, ...altAdj, ...foodAlt, ...altVerb, ...freeKeys],
      diet:       dietKeys,
      fact:       factKeys,
      factLabel:  factKeys,
      ingredient: ingKeys,
      sd:         sdKeys,
      va:         vaKeys,
      breed:      breedKeys,
      activity:   activityKeys,
      group:      groupKeys,
      job:        jobKeys
    };

    // SI mad-libs
    const SITemplates = [
      { name:"factPct",      slots:["dataBrand","dataOne","fact"],                render:c=>`What is ${c.dataBrand} ${c.dataOne} ${c.fact}%?` },
      { name:"factHowMany",  slots:["general","factLabel","dataBrand","dataOne"], render:c=>`${c.general} How many ${c.factLabel} in ${c.dataBrand} ${c.dataOne}?` },
      { name:"freeOf",       slots:["general","dataBrand","dataOne","diet"],      render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} ${c.diet}-free?` },
      { name:"ingredient",   slots:["general","dataBrand","dataOne","ingredient"],render:c=>`${c.general} Does ${c.dataBrand} ${c.dataOne} contain ${c.ingredient}?` },
      { name:"notContains",  slots:["general","dataBrand","dataOne","sd"],        render:c=>`${c.general} Does ${c.dataBrand} ${c.dataOne} contain ${c.sd}?` },
      { name:"valueAdd",     slots:["general","dataBrand","dataOne","va"],        render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} ${c.va}?` },
      { name:"breedSuit",    slots:["general","dataBrand","dataOne","breed"],     render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} suitable for ${c.breed}?` },
      { name:"activitySuit", slots:["general","dataBrand","dataOne","activity"],  render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} good for ${c.activity}?` },
      { name:"groupSuit",    slots:["general","dataBrand","dataOne","group"],     render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} good for ${c.group}?` },
      { name:"jobSuit",      slots:["general","dataBrand","dataOne","job"],       render:c=>`${c.general} Is ${c.dataBrand} ${c.dataOne} suitable for ${c.job}?` }
    ];

    // build suggestions
    const suggestions = [];
    SITemplates.forEach(t => {
      t.slots.forEach(slot => {
        (slotTokens[slot]||[]).forEach(token => {
          const ctx = {
            dataBrand: row.brandDisplay,
            dataOne:   row['data-one'],
            [slot]:    token
          };
          suggestions.push({
            question: t.render(ctx),
            keywords: [ token ],
            type:     t.name,
            answer:   ''
          });
        });
      });
    });

    return bindFuse(suggestions);
  }

  // ─── Fallback ─────────────────────────────────────────────────
  list.innerHTML = '';
  list.appendChild(makeNoResults());
}
