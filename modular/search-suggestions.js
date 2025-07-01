// search-suggestions.js
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CI_DATA }    from './ci.js';
import { SI_DATA }    from './si.js';
import { ING_ANIM }   from './ingAnim.js';
import { ING_PLANT }  from './ingPlant.js';
import { ING_SUPP }   from './ingSupp.js';

export function initSearchSuggestions(faqType = '') {
  // — UI hooks & clear old listeners —
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  const starter  = document.getElementById('pwr-initial-suggestions');
  const answerBox= document.getElementById('pwr-answer-output');
  const answerTxt= document.getElementById('pwr-answer-text');
  if (!input || !list || !sendBtn || !clearBtn) return;

  // replace nodes to clear previous listeners
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  // show/hide send+clear
  function showBtns() {
    freshSend.style.display = 'block';
    freshClear.style.display = 'block';
  }
  function hideBtns() {
    freshSend.style.display = 'none';
    freshClear.style.display = 'none';
  }

  // no-results LI
  function makeNoResults() {
    const li = document.createElement('li');
    li.className   = 'no-results';
    li.textContent = 'No results found';
    li.style.pointerEvents = 'none';
    return li;
  }

  // render starter pills (5 random)
  function renderStarter(suggestions) {
    if (!starter) return;
    starter.innerHTML = '';
    const picks = suggestions
      .map(item=>({ item, r:Math.random() }))
      .sort((a,b)=>a.r-b.r)
      .slice(0,5)
      .map(x=>x.item);
    picks.forEach(item=>{
      const a = document.createElement('a');
      a.href        = '#';
      a.textContent = item.question;
      a.className   = 'pwr-suggestion-pill';
      a.addEventListener('click', e=>{
        e.preventDefault();
        freshInput.value = item.question;
        showBtns();
        list.style.display = 'none';
      });
      starter.appendChild(a);
    });
    starter.style.display = 'flex';
  }

  // bind a Fuse instance + UI behaviors
  function bindFuse(suggestions) {
    // hide answer & show starter
    answerBox.style.display = 'none';
    renderStarter(suggestions);

    const fuse = new Fuse(suggestions, {
      keys: ['question','keywords'],
      threshold: 0.4,
      distance: 60
    });

    // on input → live suggestions
    freshInput.addEventListener('input', () => {
      const q = freshInput.value.trim();
      list.innerHTML = '';
      if (!q) {
        hideBtns();
        starter.style.display = 'flex';
        return list.style.display = 'none';
      }

      showBtns();
      starter.style.display = 'none';

      const results = fuse.search(q).slice(0,5).map(r=>r.item);
      if (!results.length) {
        list.appendChild(makeNoResults());
      } else {
        results.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.question;
          li.addEventListener('click', ()=>{
            freshInput.value = item.question;
            showBtns();
            list.style.display = 'none';
          });
          list.appendChild(li);
        });
      }
      list.style.display = 'block';
    });

    // clear
    freshClear.addEventListener('click', ()=>{
      freshInput.value = '';
      list.innerHTML   = '';
      list.style.display = 'none';
      starter.style.display = 'flex';
      hideBtns();
      answerBox.style.display = 'none';
    });

    // Enter → send
    freshInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') freshSend.click();
    });

    // send → emit selected suggestion
    freshSend.addEventListener('click', ()=>{
      const q = freshInput.value.trim();
      if (!q) return;
      const m = fuse.search(q)[0];
      if (m) {
        const detail = m.item;
        document.dispatchEvent(new CustomEvent('faq:suggestionSelected', { detail }));
      }
    });
  }

  // — CI branch (“ci”) —
  if (faqType === 'ci') {
    const five = document.getElementById('item-faq-five')?.value;
    const row  = CI_DATA.find(r => String(r['data-five']) === String(five));
    if (!row) {
      list.innerHTML = '';
      list.appendChild(makeNoResults());
      list.style.display = 'block';
      return;
    }

    // build CI suggestions
    const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };
    const sugg = [];

    // 1) alternatives
    sugg.push({
      question: `Alternatives to ${row['data-brand']} ${row['data-one']}?`,
      keywords: [row['data-brand'], row['data-one']].map(s=>s.toLowerCase()),
      type: 'alternatives',
      answer: ''
    });

    // 2) free-of
    if (row['data-diet']) {
      sugg.push({
        question: `Is ${row['data-brand']} ${row['data-one']} ${row['data-diet']}-free?`,
        keywords: [ row['data-diet'] ],
        type: 'freeOf',
        answer: ''
      });
    }

    // 3) facts (% + how many)
    [
      ['ga_crude_protein_%','protein'],
      ['ga_crude_fat_%','fat'],
      ['ga_crude_fiber_%','fiber'],
      ['ga_moisture_%','moisture'],
      ['ga_kcals_per_kg','kcals per kg'],
      ['ga_kcals_per_cup','kcals per cup']
    ].forEach(([field,label])=>{
      const v = row[field];
      if (v != null) {
        // pct
        sugg.push({
          question: `What is ${row['data-brand']} ${row['data-one']} ${label}%?`,
          keywords: [label],
          type: 'factPct',
          answer: ''
        });
        // how many
        sugg.push({
          question: `How many ${label} in ${row['data-brand']} ${row['data-one']}?`,
          keywords: [label],
          type: 'factHowMany',
          answer: ''
        });
      }
    });

    // 4) ingredient contains
    (row['ing-data-fives']||[]).forEach(d5=> {
      const ing = ingMap[d5];
      if (!ing) return;
      const name = ing.displayAs;
      const keys = [ name.toLowerCase(), ...(ing.groupWith||[]).map(g=>g.toLowerCase()) ];
      sugg.push({
        question: `Does ${row['data-brand']} ${row['data-one']} contain ${name}?`,
        keywords: keys,
        type: 'ingredient',
        answer: ''
      });
    });

    // 5) compare placeholder
    sugg.push({
      question: `Compare ${row['data-brand']} ${row['data-one']} vs [other]?`,
      keywords: [row['data-one'].toLowerCase()],
      type: 'compare',
      answer: ''
    });

    return bindFuse(sugg);
  }

  // — SI branch (“si”) —
  if (faqType === 'si') {
    const row = SI_DATA.find(r => r.faqType === faqType);
    if (!row) {
      list.innerHTML = '';
      list.appendChild(makeNoResults());
      list.style.display = 'block';
      return;
    }

    const ingMap = { ...ING_ANIM, ...ING_PLANT, ...ING_SUPP };

    // static token lists
    const generalKeys = ["What","What's","Is","How many","Does","Compare","For","Food for"];
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
    const altVerb  = ["for","to","with","without","contain","recommendations for","options for","vet recommended","veterinarian recommended","best","recommended for"];
    const freeKeys = ["free","free of","without","no"];

    // dynamic token sets
    const slotTokens = {
      general:    [...generalKeys, ...altAdj, ...foodAlt, ...altVerb, ...freeKeys].map(s=>s.toLowerCase()),
      diet:       dietKeys,
      fact:       factKeys,
      factLabel:  factKeys,
      ingredient: (row['ing-data-fives']||[]).flatMap(d5=>{
        const i = ingMap[d5];
        return i ? [ i.displayAs.toLowerCase(), ...(i.groupWith||[]).map(g=>g.toLowerCase()) ] : [];
      }),
      sd:         (row['not-data-fives']||[]).flatMap(d5=>{
        const i = ingMap[d5];
        return i ? [ i.displayAs.toLowerCase() ] : [];
      }),
      va:         (row['va-data-fives']||[]).map(d5=>d5.toLowerCase()), // if you map to VA_DATA, adjust here
      breed:      (row['dogBr-fives']||[]).map(d5=>d5.toLowerCase()),
      activity:   (row.dogKeys_ac||[]).map(s=>s.toLowerCase()),
      group:      (row.dogKeys_gp||[]).map(s=>s.toLowerCase()),
      job:        (row.dogKeys_jb||[]).map(s=>s.toLowerCase())
    };

    // fallbacks
    ['breed','activity','group','job'].forEach(slot=>{
      if (!slotTokens[slot].length) slotTokens[slot] = ['active dogs'];
    });

    // SI templates
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

    // build the suggestion list
    const suggestions = [];
    SITemplates.forEach(tpl=>{
      tpl.slots.forEach(slot=>{
        (slotTokens[slot]||[]).forEach(token=>{
          const ctx = {
            dataBrand: row.brandDisplay || row['data-brand'],
            dataOne:   row['data-one'],
            [slot]:    token
          };
          suggestions.push({
            question: tpl.render(ctx),
            keywords: [ token ],
            type:     tpl.name,
            answer:   ''
          });
        });
      });
    });

    return bindFuse(suggestions);
  }

  // — fallback —
  list.innerHTML = '';
  list.appendChild(makeNoResults());
  list.style.display = 'block';
}
