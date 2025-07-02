// search-suggestions-si.js (classic, no ES exports/imports)
(function() {
  // ---- Full Token Banks ----
  var general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
  var foodAlt  = ["kibble", "dog food", "dry dog food", "dry dog food with", "dog food for", "kibble for"];
  var altAdj   = ["best", "top", "recommended", "premium", "customer favorite"];
  var altVerb  = ["for", "to", "with", "without", "contain", "recommended for", "options for", "vet recommended", "veterinarian recommended"];
  var fact     = [
    "protein", "fat", "fiber", "moisture", "kcals per cup", "kcals per kg",
    "omega 6 fatty acids", "omega 3 fatty acids", "animal protein",
    "ash", "calcium", "vitamin d3", "vitamin e", "vitamin b12"
  ];
  var freeKeys = ["free", "free of", "without", "no"];

  function formatFactValue(key, val) {
    if (/_%$/.test(key)) return val + '%';
    if (/per_cup/.test(key)) return val + ' kcals per cup';
    if (/per_kg/.test(key)) return val + ' kcals per kg';
    if (/lbs/.test(key)) return val + ' lbs';
    return val;
  }

  // Wait until DOM & data are ready
  function ready(fn) {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function() {
    // Get DOM nodes
    var input    = document.getElementById('pwr-prompt-input');
    var list     = document.getElementById('pwr-suggestion-list');
    var sendBtn  = document.getElementById('pwr-send-button');
    var clearBtn = document.getElementById('pwr-clear-button');
    var starter  = document.getElementById('pwr-initial-suggestions');
    var answerBox= document.getElementById('pwr-answer-output');
    var answerTxt= document.getElementById('pwr-answer-text');
    if (!input || !list || !sendBtn || !clearBtn) return;

    var five = document.getElementById('item-faq-five')?.value;
    var row  = window.SI_DATA.find(function(r) { return String(r['data-five']) === String(five); });
    if (!row) return;
    var ingMap = Object.assign({}, window.ING_ANIM, window.ING_PLANT, window.ING_SUPP);

    // --- Build suggestions (same logic as before, classic style) ---
    var suggestions = [];

    (row['ing-data-fives']||[]).forEach(function(d5){
      var ing = ingMap[d5];
      if (!ing) return;
      suggestions.push({
        type: "ingredient-contains",
        question: "Does " + row['data-brand'] + " " + row['data-one'] + " contain " + ing.displayAs + "?",
        keywords: [ing.displayAs.toLowerCase()].concat(ing.groupWith ? [ing.groupWith.toLowerCase()] : []),
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " contains " + ing.displayAs + "."
      });
    });
    (row['not-data-fives']||[]).forEach(function(d5){
      var ing = ingMap[d5];
      if (!ing) return;
      suggestions.push({
        type: "ingredient-not-contains",
        question: "Does " + row['data-brand'] + " " + row['data-one'] + " contain " + ing.displayAs + "?",
        keywords: [ing.displayAs.toLowerCase()].concat(ing.groupWith ? [ing.groupWith.toLowerCase()] : []),
        answer: "No, " + row['data-brand'] + " " + row['data-one'] + " does not contain " + ing.displayAs + "."
      });
    });
    ["data-legumes","data-poultry","data-grain"].forEach(function(key){
      if (row[key]) {
        suggestions.push({
          type: "free-of",
          question: "Is " + row['data-brand'] + " " + row['data-one'] + " " + row[key] + "?",
          keywords: [row[key].replace(' Free','').toLowerCase(), "free"],
          answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is " + row[key].toLowerCase() + "."
        });
      }
    });
    fact.forEach(function(fk){
      var dataKey = Object.keys(row).find(function(k){
        return k.replace(/[_ ]+/g,'').includes(fk.replace(/[_ ]+/g,''));
      });
      if (dataKey && row[dataKey] != null) {
        var val = formatFactValue(dataKey, row[dataKey]);
        suggestions.push({
          type: "fact",
          question: "What is " + row['data-brand'] + " " + row['data-one'] + " " + fk + "?",
          keywords: [fk.toLowerCase()],
          answer: fk.charAt(0).toUpperCase() + fk.slice(1) + " for " + row['data-brand'] + " " + row['data-one'] + " is " + val + "."
        });
        suggestions.push({
          type: "fact-how-many",
          question: "How many " + fk + " in " + row['data-brand'] + " " + row['data-one'] + "?",
          keywords: [fk.toLowerCase()],
          answer: "There are " + val + " " + fk + " in " + row['data-brand'] + " " + row['data-one'] + "."
        });
      }
    });
    (row['va-data-fives']||[]).forEach(function(va){
      suggestions.push({
        type: "va",
        question: "Is " + row['data-brand'] + " " + row['data-one'] + " " + va + "?",
        keywords: [va.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is " + va + "."
      });
    });
    (row['dogBr-fives']||[]).forEach(function(b){
      suggestions.push({
        type: "breed-suit",
        question: "Is " + row['data-brand'] + " " + row['data-one'] + " suitable for " + b + "?",
        keywords: [b.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is suitable for " + b + "."
      });
    });
    (row['dogKeys_ac']||[]).forEach(function(a){
      suggestions.push({
        type: "activity-suit",
        question: "Is " + row['data-brand'] + " " + row['data-one'] + " good for " + a + "?",
        keywords: [a.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is good for " + a + "."
      });
    });
    (row['dogKeys_gp']||[]).forEach(function(g){
      suggestions.push({
        type: "group-suit",
        question: "Is " + row['data-brand'] + " " + row['data-one'] + " good for " + g + "?",
        keywords: [g.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is good for " + g + "."
      });
    });
    (row['dogKeys_jb']||[]).forEach(function(j){
      suggestions.push({
        type: "job-suit",
        question: "Is " + row['data-brand'] + " " + row['data-one'] + " suitable for " + j + "?",
        keywords: [j.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is suitable for " + j + "."
      });
    });

    // --- Fuzzy Search (Fuse.js loaded as a <script> before this file) ---
    var fuse = new window.Fuse(suggestions, {
      keys: ['question','keywords'],
      threshold: 0.4,
      distance: 60
    });

    function renderStarter() {
      starter.innerHTML = '';
      suggestions
        .map(function(item){ return { item, r:Math.random() }; })
        .sort(function(a,b){ return a.r-b.r; })
        .slice(0,5)
        .map(function(x){ return x.item; })
        .forEach(function(item){
          var a = document.createElement('button');
          a.className = 'pwr-suggestion-pill';
          a.textContent = item.question;
          a.onclick = function(e){
            e.preventDefault();
            input.value = item.question;
            showBtns();
            list.style.display = 'none';
            showAnswer(item.answer);
          };
          starter.appendChild(a);
        });
      starter.style.display = 'flex';
    }
    function showBtns() { sendBtn.style.display = 'block'; clearBtn.style.display = 'block'; }
    function hideBtns() { sendBtn.style.display = 'none'; clearBtn.style.display = 'none'; }
    function showAnswer(text) {
      answerTxt.textContent = '';
      answerBox.style.display = 'block';
      if (window.Typed) new window.Typed(answerTxt, { strings: [text], typeSpeed: 18, showCursor: false });
      else answerTxt.textContent = text;
      starter.style.display = 'none';
      list.style.display    = 'none';
    }
    function resetAll() {
      input.value = '';
      hideBtns();
      list.style.display    = 'none';
      starter.style.display = 'flex';
      answerBox.style.display = 'none';
    }

    // --- Live typeahead suggestions
    input.addEventListener('input', function() {
      var q = input.value.trim();
      list.innerHTML = '';
      showBtns();
      if (!q) {
        list.style.display = 'none';
        starter.style.display = 'flex';
        return;
      }
      starter.style.display = 'none';
      var results = fuse.search(q).slice(0,5).map(function(r){return r.item;});
      if (!results.length) {
        var li = document.createElement('li');
        li.className = 'no-results';
        li.textContent = 'No results found';
        li.style.pointerEvents = 'none';
        list.appendChild(li);
      } else {
        results.forEach(function(item) {
          var li = document.createElement('li');
          li.textContent = item.question;
          li.onclick = function(){
            input.value = item.question;
            showBtns();
            showAnswer(item.answer);
          };
          list.appendChild(li);
        });
      }
      list.style.display = 'block';
    });

    clearBtn.onclick = resetAll;
    input.addEventListener('keydown', function(e){ if (e.key==='Enter') sendBtn.click(); });
    sendBtn.onclick = function() {
      var q = input.value.trim();
      if (!q) return;
      var found = fuse.search(q);
      if (found.length) showAnswer(found[0].item.answer || 'No answer set.');
      else showAnswer('No answer set.');
    };
    var closeBtn = answerBox.querySelector('.pwr-answer-close');
    if (closeBtn) closeBtn.onclick = resetAll;

    hideBtns();
    answerBox.style.display = 'none';
    renderStarter();
  });
})();
