// wizard.js
export function initMultiWizard(configs) {
  // DOM elements
  const wizard     = document.querySelector('.chat-wizard');
  const heading    = document.getElementById('wizard-heading');
  const thread     = document.getElementById('wizardThread');
  const input      = document.getElementById('wizard-input');
  const btnNext    = document.getElementById('wizard-next');
  const btnSend    = document.getElementById('wizard-send');
  const btnClose   = document.getElementById('wizard-close');
  const btnRestart = document.getElementById('wizard-restart');
  const btnClear   = document.getElementById('input-clear');

  if (!wizard || !heading || !thread || !input || !btnNext || !btnSend) {
    console.error('Wizard: missing required DOM elements');
    return;
  }

  // State
  let state = { data:{}, idx:0, cfg:null };
  let lastFocus = null;
  let resetTimeoutId = null;
  let transitionFallbackId = null;
  const TRANSITION_DURATION = 400; // ms, match your CSS .4s

  // Helpers
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
    // bounds check
    if (!state.cfg || state.idx < 0 || state.idx >= state.cfg.steps.length) return;
    const s = state.cfg.steps[state.idx];
    showTyping();

    setTimeout(() => {
      removeTyping();
      // Bot prompt
      const promptText = typeof s.prompt === 'function' ? s.prompt(state) : s.prompt;
      showBubble(promptText, 'bot');

      // Configure input
      input.placeholder = s.placeholder || '';
      input.type        = s.key === 'password' ? 'password' : 'text';
      input.value       = '';
      input.disabled    = false;
      input.classList.remove('shake');

      // Toggle input visibility for confirm step
      if (s.confirm) {
        input.style.display = 'none';
        btnNext.style.display = 'none';
        btnSend.style.display = 'inline-flex';
        btnSend.disabled = false;
      } else {
        input.style.display = '';
        btnNext.style.display = 'inline-flex';
        btnNext.disabled = true;
        btnSend.style.display = 'none';
        input.focus();
      }
    }, 600);
  }

  function openWizard(key) {
    // reset state
    state.data = {};
    state.idx  = 0;
    state.cfg  = configs[key];
    if (!state.cfg) return console.error('Wizard: no config for', key);

    // clear thread & set heading
    thread.innerHTML = '';
    heading.innerText = state.cfg.title;

    // store focus
    lastFocus = document.activeElement;

    // ARIA + scroll-lock
    wizard.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // show overlay + panel
    wizard.classList.add('active');

    // wait for slide up
    wizard.addEventListener('transitionend', onTransitionEnd);
    transitionFallbackId = setTimeout(onTransitionEnd, TRANSITION_DURATION + 50);
  }

  function onTransitionEnd(e) {
    if (e && e.propertyName !== 'transform') return;
    wizard.removeEventListener('transitionend', onTransitionEnd);
    clearTimeout(transitionFallbackId);
    showStep();
  }

  function closeWizard() {
    // hide overlay
    wizard.classList.remove('active');
    wizard.setAttribute('aria-hidden', 'true');

    // unlock scroll
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    // clear any pending resets
    clearTimeout(resetTimeoutId);
    clearTimeout(transitionFallbackId);

    // restore focus
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trapFocus(e) {
    if (!wizard.classList.contains('active')) return;
    if (e.key !== 'Tab') return;
    const focusable = Array.from(wizard.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // Input listener: enable Next/Send when valid
  input.addEventListener('input', () => {
    const s = state.cfg.steps[state.idx];
    const ok = input.value.trim() && (!s.validate || s.validate(input.value));
    if (btnNext.style.display !== 'none') btnNext.disabled = !ok;
    if (btnSend.style.display !== 'none') btnSend.disabled = !ok;
  });

  // Next button
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

  // Send button with delayed reset
  btnSend.addEventListener('click', e => {
    e.preventDefault();
    showBubble('Yes, ' + state.cfg.title.toLowerCase() + ' it', 'user');

    // populate & submit hidden form
    const form = document.getElementById(state.cfg.formId);
    Object.entries(state.data).forEach(([k, val]) => {
      const fld = form.querySelector('#wizard-' + k);
      if (fld) fld.value = val;
    });
    form.submit();

    showBubble('✅ Done!', 'bot');

    // reset after 1 minute
    resetTimeoutId = setTimeout(() => {
      if (wizard.classList.contains('active')) openWizard(Object.keys(configs).find(key => configs[key] === state.cfg));
    }, 60_000);
  });

  // Close / Restart / Clear
  btnClose.addEventListener('click', closeWizard);
  btnRestart.addEventListener('click', () => openWizard(Object.keys(configs).find(key => configs[key] === state.cfg)));
  btnClear.addEventListener('click', () => { input.value = ''; input.focus(); });

  // Click outside wizard closes it
  wizard.addEventListener('click', e => {
    if (e.target === wizard) closeWizard();
  });

  // Escape key closes & traps focus
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeWizard();
    trapFocus(e);
  });

  // Trigger buttons
  document.querySelectorAll('[data-wizard]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const key = btn.dataset.wizard;
      if (configs[key]) openWizard(key);
    });
  });
}
