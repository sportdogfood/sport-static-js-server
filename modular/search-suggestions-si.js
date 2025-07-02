// search-suggestions-si.js (CLASSIC - NO EXPORTS, NO IMPORTS, SELF-CONTAINED)
(function() {
  // ======= DATA: Replace these with your actual datasets =======
  // (Example. You must inline your SI_DATA and ING_XXX data here.)
  var SI_DATA = window.SI_DATA; // <-- Set window.SI_DATA before including this!
  var ING_ANIM = window.ING_ANIM || {};
  var ING_PLANT = window.ING_PLANT || {};
  var ING_SUPP = window.ING_SUPP || {};

  // ======= SEARCH LOGIC =======
  var general  = ["What", "What's", "Is", "How many", "Does", "Compare"];
  var fact     = [
    "protein", "fat", "fiber", "moisture", "kcals per cup", "kcals per kg",
    "omega 6 fatty acids", "omega 3 fatty acids", "animal protein",
    "ash", "calcium", "vitamin d3", "vitamin e", "vitamin b12"
  ];

  function formatFactValue(key, val) {
    if (/_%$/.test(key)) return val + "%";
    if (/per_cup/.test(key)) return val + " kcals per cup";
    if (/per_kg/.test(key)) return val + " kcals per kg";
    if (/lbs/.test(key)) return val + " lbs";
    return val;
  }

  function buildSuggestions(row, ingMap) {
    var suggestions = [];
    // Ingredient Contains
    (row['ing-data-fives']||[]).forEach(function(d5) {
      var ing = ingMap[d5];
      if (!ing) return;
      suggestions.push({
        type: "ingredient-contains",
        question: "Does " + row['data-brand'] + " " + row['data-one'] + " contain " + ing.displayAs + "?",
        keywords: [ing.displayAs.toLowerCase()],
        answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " contains " + ing.displayAs + "."
      });
    });
    // Ingredient NOT Contains
    (row['not-data-fives']||[]).forEach(function(d5) {
      var ing = ingMap[d5];
      if (!ing) return;
      suggestions.push({
        type: "ingredient-not-contains",
        question: "Does " + row['data-brand'] + " " + row['data-one'] + " contain " + ing.displayAs + "?",
        keywords: [ing.displayAs.toLowerCase()],
        answer: "No, " + row['data-brand'] + " " + row['data-one'] + " does not contain " + ing.displayAs + "."
      });
    });
    // Free-Of (Grain, Legumes, Poultry, etc)
    ["data-legumes","data-poultry","data-grain"].forEach(function(key) {
      if (row[key]) {
        suggestions.push({
          type: "free-of",
          question: "Is " + row['data-brand'] + " " + row['data-one'] + " " + row[key] + "?",
          keywords: [row[key].replace(' Free','').toLowerCase(), "free"],
          answer: "Yes, " + row['data-brand'] + " " + row['data-one'] + " is " + row[key].toLowerCase() + "."
        });
      }
    });
    // Facts (Percentages and Amounts)
    fact.forEach(function(fk) {
      var dataKey = Object.keys(row).find(function(k) {
        return k.replace(/[_ ]+/g,'').includes(fk.replace(/[_ ]+/g,''));
      });
      if (dataKey && row[dataKey] !== undefined && row[dataKey] !== null) {
        var val = formatFactValue(dataKey, row[dataKey]);
        suggestions.push({
          type: "fact",
          question: "What is " + row['data-brand'] + " " + row['data-one'] + " " + fk + "?",
          keywords: [fk.toLowerCase()],
          answer: fk.charAt(0).toUpperCase()+fk.slice(1) + " for " + row['data-brand'] + " " + row['data-one'] + " is " + val + "."
        });
      }
    });
    return suggestions;
  }

  window.initSearchSuggestions = function() {
    // --- DOM hooks
    var input    = document.getElementById('pwr-prompt-input');
    var list     = document.getElementById('pwr-suggestion-list');
    var sendBtn  = document.getElementById('pwr-send-button');
    var clearBtn = document.getElementById('pwr-clear-button');
    var starter  = document.getElementById('pwr-initial-suggestions');
    var answerBox= document.getElementById('pwr-answer-output');
    var answerTxt= document.getElementById('pwr-answer-text');
    if (!input || !list || !sendBtn || !clearBtn) return;

    var five = document.getElementById('item-faq-five') ? document.getElementById('item-faq-five').value : null;
    var row  = (SI_DATA || []).find(function(r) { return String(r['data-five']) === String(five); });
    if (!row) return;
    var ingMap = Object.assign({}, ING_ANIM, ING_PLANT, ING_SUPP);
    var suggestions = buildSuggestions(row, ingMap);

    // Simple filter function (since Fuse is not available)
    function filterSuggestions(q) {
      var term = q.trim().toLowerCase();
      return suggestions.filter(function(item) {
        return item.question.toLowerCase().includes(term) ||
          (item.keywords||[]).some(function(k) { return k.includes(term); });
      }).slice(0,5);
    }

    function renderStarter() {
      starter.innerHTML = '';
      suggestions.slice(0,5).forEach(function(item) {
        var a = document.createElement('button');
        a.className = 'pwr-suggestion-pill';
        a.textContent = item.question;
        a.addEventListener('click', function(e){
          e.preventDefault();
          input.value = item.question;
          showBtns();
          list.style.display = 'none';
          showAnswer(item.answer);
        });
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
      var results = filterSuggestions(q);
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
          li.addEventListener('click', function(){
            input.value = item.question;
            showBtns();
            showAnswer(item.answer);
          });
          list.appendChild(li);
        });
      }
      list.style.display = 'block';
    });

    clearBtn.addEventListener('click', resetAll);
    input.addEventListener('keydown', function(e) { if (e.key==='Enter') sendBtn.click(); });
    sendBtn.addEventListener('click', function() {
      var q = input.value.trim();
      if (!q) return;
      var found = filterSuggestions(q);
      if (found.length) showAnswer(found[0].answer || 'No answer set.');
      else showAnswer('No answer set.');
    });
    if (answerBox.querySelector('.pwr-answer-close')) answerBox.querySelector('.pwr-answer-close').addEventListener('click', resetAll);

    // --- Initial pills
    hideBtns();
    answerBox.style.display = 'none';
    renderStarter();
  };
})();
