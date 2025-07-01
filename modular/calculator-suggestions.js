/* calculator-suggestions.js */
import Fuse   from 'https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs';
import { CF_DATA } from './cf.js';  // “calc” pages (any formula)
import { SF_DATA } from './sf.js';  // sport‐only formulas if you prefer

export function initCalculatorSuggestions(faqType = 'calc') {
  // ─── UI hookup ────────────────────────────────────────────────
  const input    = document.getElementById('pwr-prompt-input');
  const list     = document.getElementById('pwr-suggestion-list');
  const sendBtn  = document.getElementById('pwr-send-button');
  const clearBtn = document.getElementById('pwr-clear-button');
  if (!input || !list || !sendBtn || !clearBtn) return;

  // replace nodes to clear old listeners
  input.replaceWith(input.cloneNode(true));
  sendBtn.replaceWith(sendBtn.cloneNode(true));
  clearBtn.replaceWith(clearBtn.cloneNode(true));
  const freshInput = document.getElementById('pwr-prompt-input');
  const freshSend  = document.getElementById('pwr-send-button');
  const freshClear = document.getElementById('pwr-clear-button');

  // ─── Defaults & localStorage hooks (commented) ───────────────
  let lifeStage = 'adult';
  // const savedLife = localStorage.getItem('userLifeStage');
  // if (savedLife) lifeStage = savedLife;

  // ─── Pick our dataset & row ───────────────────────────────────
  const dataSet = faqType === 'calc' ? CF_DATA : SF_DATA;
  const five    = document.getElementById('item-faq-five').value;
  const row     = dataSet.find(r => String(r['data-five']) === five);
  if (!row) return;

  // override row with defaults
  row.conditional_life_selected = lifeStage;
  // let defaultWeight = row.dynamic_weight_input;
  // const savedBreed = localStorage.getItem('userBreed');
  // if (savedBreed) {
  //   const breedWeightMap = { 'labrador retriever': 60, 'border collie':30 /*…*/ };
  //   if (breedWeightMap[savedBreed]) defaultWeight = breedWeightMap[savedBreed];
  // }
  // row.dynamic_weight_input = defaultWeight;

  // ─── 1. Build static “fact” + baseline entries ───────────────
  const staticEntries = [];
  // a) static fact fields
  const factMap = [
    { label:'price per bag',     field:'specs_price_per_bag' },
    { label:'bag size (lbs)',    field:'specs_bag-size_lbs' },
    { label:'protein %',         field:'ga_crude_protein_%' },
    { label:'fat %',             field:'ga_crude_fat_%' },
    { label:'kcals per kg',      field:'ga_kcals_per_kg' },
    { label:'kcals per cup',     field:'ga_kcals_per_cup' }
  ];
  factMap.forEach(f=>{
    staticEntries.push({
      question: `What is ${row['data-brand']} ${row['data-one']} ${f.label}?`,
      keywords: [ f.label ],
      type: 'fact-static',
      answer:''
    });
  });
  // b) baseline calculator outputs
  const baselineMap = [
    { label:'cups per day',  field:'calc_cups_per_day' },
    { label:'cups in a bag', field:'calc_cups_in_bag' },
    { label:'days in a bag', field:'calc_days_in_bag' },
    { label:'cost per day',  field:'calc_cost_per_day' },
    { label:'cost per cup',  field:'calc_cost_per_cup' }
  ];
  baselineMap.forEach(b=>{
    staticEntries.push({
      question: `How many ${b.label} for ${row['data-brand']} ${row['data-one']}?`,
      keywords: [ b.label.split(' ')[0] ],  // e.g. “cups”, “cost”
      type: 'baseline',
      answer:''
    });
  });

  // build fuse for static
  const staticFuse = new Fuse(staticEntries, {
    keys:['question','keywords'], threshold:0.4, distance:60
  });
  const makeNoResults = () => {
    const li = document.createElement('li');
    li.className='no-results';
    li.textContent='No results found';
    li.style.pointerEvents='none';
    return li;
  };

  // ─── 2. Dynamic “what-if” templates ──────────────────────────
  const activityKeys = ["active","working","highly active","performance","sport"];
  const unitKeys     = ["lb","kg","pound","kilogram"];
  // (optionally) your breedKeys map from DOG_DATA
  const breedKeys    = []; // later fill from localStorage or row

  const dynTemplates = [
    {
      type:'calc-feed',
      keywords:['how much','how many','feed'],
      render: q=>{
        const wMatch = q.match(/(\d+)\s?(?:lb|kg)?/);
        const w = wMatch ? wMatch[1] : row.dynamic_weight_input;
        const act = activityKeys.find(a=>q.includes(a))||'active';
        const brd = breedKeys.find(b=>q.includes(b))||'dog';
        return `How much to feed a ${w}lb ${act} ${brd}?`;
      }
    },
    {
      type:'calc-duration',
      keywords:['how long','last','bag'],
      render: q=>{
        const wMatch = q.match(/(\d+)\s?(?:lb|kg)?/);
        const w = wMatch ? wMatch[1] : row.dynamic_weight_input;
        const act = activityKeys.find(a=>q.includes(a))||'active';
        const brd = breedKeys.find(b=>q.includes(b))||'dog';
        return `How long will a bag of ${row['data-brand']} ${row['data-one']} last feeding a ${w}lb ${act} ${brd}?`;
      }
    },
    {
      type:'compare-sport',
      keywords:['compare','sport','cub','herding','dock'],
      render: ()=>`Compare ${row['data-brand']} ${row['data-one']} to Sport Cub Puppy`
    }
  ];

  // fuse index for dynamic
  const dynIndex = [];
  dynTemplates.forEach(t=>{
    t.keywords.forEach(k=>{
      dynIndex.push({ template:t, key:k });
    });
  });
  const dynFuse = new Fuse(dynIndex, { keys:['key'], threshold:0.3 });

  function suggestDynamic(q) {
    const txt = q.toLowerCase();
    let matches = dynIndex.filter(e=>txt.includes(e.key));
    if (!matches.length) matches = dynFuse.search(txt).map(r=>r.item.template);
    return Array.from(new Set(matches)).slice(0,3).map(t=>t.render(txt));
  }

  // ─── 3. Wire the UI ─────────────────────────────────────────
  freshInput.addEventListener('input', () => {
    const q = freshInput.value.trim();
    list.innerHTML = '';
    freshSend.style.display = freshClear.style.display = q ? 'block' : 'none';
    if (!q) return list.style.display = 'none';

    // dynamic if weight/unit or dynKeywords present
    const useDyn = /\d/.test(q) || dynFuse.search(q).length > 0;
    if (useDyn) {
      const suggestions = suggestDynamic(q);
      if (!suggestions.length) {
        list.appendChild(makeNoResults());
      } else {
        suggestions.forEach(txt=>{
          const li = document.createElement('li');
          li.textContent = txt;
          li.addEventListener('click', ()=>{ freshInput.value=txt; list.style.display='none'; });
          list.appendChild(li);
        });
      }
    } else {
      // static facts & baseline
      const results = staticFuse.search(q).slice(0,5).map(r=>r.item);
      if (!results.length) {
        list.appendChild(makeNoResults());
      } else {
        results.forEach(item=>{
          const li=document.createElement('li');
          li.textContent=item.question;
          li.addEventListener('click', ()=>{
            freshInput.value=item.question;
            list.style.display='none';
          });
          list.appendChild(li);
        });
      }
    }

    list.style.display = 'block';
  });

  freshClear.addEventListener('click', () => {
    freshInput.value='';
    list.innerHTML='';
    list.style.display='none';
    freshSend.style.display=freshClear.style.display='none';
  });
  freshInput.addEventListener('keydown', e=>{ if(e.key==='Enter') freshSend.click(); });

  freshSend.addEventListener('click', ()=>{
    const q = freshInput.value.trim();
    if (!q) return;
    const useDyn = /\d/.test(q) || dynFuse.search(q).length > 0;
    if (useDyn) {
      const [first] = suggestDynamic(q);
      document.dispatchEvent(new CustomEvent('calculator:run',{detail:{ query:first, row }}));
    } else {
      const match = staticFuse.search(q)[0];
      if (match) {
        document.dispatchEvent(new CustomEvent('calculator:run',{detail:{
          query: match.item.question,
          row,
          type: match.item.type
        }}));
      }
    }
  });
}
