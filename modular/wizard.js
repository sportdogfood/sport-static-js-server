// wizard.js
export function initMultiWizard(configs) {
  const wizard     = document.querySelector('.chat-wizard');
  const heading    = document.getElementById('wizard-heading');
  const thread     = document.getElementById('wizardThread');
  const input      = document.getElementById('wizard-input');
  const btnNext    = document.getElementById('wizard-next');
  const btnSend    = document.getElementById('wizard-send');
  const btnClose   = document.getElementById('wizard-close');
  const btnRestart = document.getElementById('wizard-restart');
  const btnClear   = document.getElementById('input-clear');

  let state = { data:{}, idx:0, cfg:null };

  function showBubble(txt, who) {
    const d = document.createElement('div');
    d.className = 'chat-msg ' + (who==='bot'?'messagex-bot':'messagex-user');
    d.innerText = txt;
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'chat-msg messagex-bot';
    t.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    thread.appendChild(t);
    thread.scrollTop = thread.scrollHeight;
  }

  function removeTyping() {
    const t = thread.querySelector('.typing')?.closest('.chat-msg');
    if (t) t.remove();
  }

  function showStep() {
    const s = state.cfg.steps[state.idx];
    showTyping();

    setTimeout(() => {
      removeTyping();
      // Bot prompt
      const promptText = typeof s.prompt === 'function'
        ? s.prompt(state)
        : s.prompt;
      showBubble(promptText, 'bot');

      // Configure input
      input.placeholder = s.placeholder || '';
      input.type        = (s.key === 'password' ? 'password' : 'text');
      input.value       = '';
      input.disabled    = false;
      input.classList.remove('shake');

      // Toggle buttons
      if (s.confirm) {
        btnNext.style.display = 'none';
        btnSend.style.display = 'inline-flex';
        btnSend.disabled      = false; // always enabled on confirm step
      } else {
        btnNext.style.display = 'inline-flex';
        btnNext.disabled      = true;
        btnSend.style.display = 'none';
        input.focus();
      }
    }, 600);
  }

  function resetWizard() {
    state.data = {};
    state.idx  = 0;
    thread.innerHTML = '';
    heading.innerText = state.cfg.title;

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    wizard.classList.add('active');

    // Wait for slide-up animation before first prompt
    wizard.addEventListener('transitionend', function cb(e) {
      if (e.propertyName === 'transform') {
        wizard.removeEventListener('transitionend', cb);
        showStep();
      }
    });
  }

  // Button enabling on input
  input.addEventListener('input', () => {
    const s = state.cfg.steps[state.idx];
    const valid = input.value.trim() && (!s.validate || s.validate(input.value));
    if (btnNext.style.display !== 'none')  btnNext.disabled = !valid;
    if (btnSend.style.display !== 'none')  btnSend.disabled = !valid;
  });

  // Next (non-confirm) handler
  btnNext.addEventListener('click', e => {
    e.preventDefault();
    const s = state.cfg.steps[state.idx];
    const v = input.value.trim();
    if (!v || (s.validate && !s.validate(v))) {
      input.classList.add('shake');
      return;
    }
    state.data[s.key] = v;
    showBubble(v, 'user');
    state.idx++;
    showStep();
  });

  // Send (confirm) handler
  btnSend.addEventListener('click', e => {
    e.preventDefault();
    // user “Yes, send it”
    showBubble('Yes, ' + state.cfg.title.toLowerCase() + ' it', 'user');
    // populate & submit
    const form = document.getElementById(state.cfg.formId);
    Object.entries(state.data).forEach(([k, val]) => {
      const fld = form.querySelector('#wizard-' + k);
      if (fld) fld.value = val;
    });
    form.submit();
    showBubble('✅ Done!', 'bot');
  });

  // Close, Restart, Clear
  btnClose.addEventListener('click', () => {
    wizard.classList.remove('active');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  });
  btnRestart.addEventListener('click', resetWizard);
  btnClear.addEventListener('click', () => {
    input.value = '';
    input.focus();
  });

  // Wire up triggers
  document.querySelectorAll('[data-wizard]').forEach(btn => {
    btn.addEventListener('click', e => {
      const key = btn.dataset.wizard;
      if (!configs[key]) return;
      state.cfg = configs[key];
      resetWizard();
    });
  });
}
