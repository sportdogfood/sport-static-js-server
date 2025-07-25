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

  if (!wizard || !heading || !thread || !input || !btnNext || !btnSend) {
    console.error('Wizard: missing required DOM elements');
    return;
  }

  let state = { data: {}, idx: 0, cfg: null };
  let lastFocus = null;
  let resetTimeoutId = null;
  let transitionFallbackId = null;
  const TRANSITION_DURATION = 400;

  function showBubble(text, who) {
    const d = document.createElement('div');
    d.className = 'chat-msg ' + (who === 'bot' ? 'messagex-bot' : 'messagex-user');
    d.innerHTML = text;
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

  function scramble(str) {
    const arr = Array.from(str);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  function showStep() {
    if (!state.cfg) return;
    const s = state.cfg.steps[state.idx];
    showTyping();

    setTimeout(() => {
      removeTyping();
      let promptText = typeof s.prompt === 'function' ? s.prompt(state) : s.prompt;
      if (s.confirm) promptText += ` <button id="wizard-send-inline" class="btn-inline-send">Send</button>`;
      showBubble(promptText, 'bot');

      input.placeholder = s.placeholder || `Please enter your ${s.key || 'response'}...`;
      input.type = s.key === 'password' ? 'password' : 'text';
      input.value = '';
      input.disabled = false;
      input.classList.remove('shake');

      if (s.confirm) {
        input.style.display = 'none';
        btnNext.style.display = 'none';
        btnSend.style.display = 'inline-flex';
        btnSend.disabled = false;

        setTimeout(() => {
          const btnInline = document.getElementById('wizard-send-inline');
          if (btnInline) {
            btnInline.addEventListener('click', () => btnSend.click());
          }
        }, 100);
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
    const storedEmail   = localStorage.getItem('fx_customerEmail');
    const storedId      = localStorage.getItem('fx_customerId');
    const storedRegion  = localStorage.getItem('userRegion');

    state.data = {};
    state.cfg = configs[key];

    if (!state.cfg) return console.error('Wizard: no config for', key);

    if (storedEmail && storedId) {
      state.data.Email   = storedEmail;
      state.data.Foxy_id = storedId;
      if (storedRegion) state.data.Region = storedRegion;

      const startIdx = state.cfg.steps.findIndex(s => s.key === 'message');
      state.idx = startIdx > -1 ? startIdx : 0;
    } else {
      state.idx = 0;
    }

    thread.innerHTML = '';
    heading.innerText = state.cfg.title;

    lastFocus = document.activeElement;
    wizard.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    wizard.classList.add('active');

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
    wizard.classList.remove('active');
    wizard.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    clearTimeout(resetTimeoutId);
    clearTimeout(transitionFallbackId);
    if (lastFocus?.focus) lastFocus.focus();
  }

  function trapFocus(e) {
    if (!wizard.classList.contains('active') || e.key !== 'Tab') return;
    const focusable = Array.from(
      wizard.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    ).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  input.addEventListener('input', () => {
    const s = state.cfg.steps[state.idx];
    const valid = input.value.trim() && (!s.validate || s.validate(input.value));
    if (btnNext.style.display !== 'none') btnNext.disabled = !valid;
    if (btnSend.style.display !== 'none') btnSend.disabled = !valid;
  });

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

  btnSend.addEventListener('click', async e => {
    e.preventDefault();

    const moduleName = state.cfg.formModule || 'Leads';
    const fn      = state.data.firstName || '';
    const email   = state.data.Email || '';
    const foxyId  = state.data.Foxy_id || '';
    const region  = state.data.Region || '';
    const message = state.data.message || '';

    const payload = {
      Last_Name:  scramble(fn),
      First_Name: fn,
      Email:      email,
      Message:    message,
      Foxy_id:    foxyId,
      Region:     region
    };

    const setInputValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };

    setInputValue('wizard-email', email);
    setInputValue('wizard-foxy_id', foxyId);
    setInputValue('wizard-region', region);
    setInputValue('wizard-name', fn);
    setInputValue('wizard-message', message);

    const endpoint = `https://zaproxy-7ec3ff690999.herokuapp.com/zoho/${moduleName}`;

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await resp.json();
      if (resp.ok && body.data) {
        const hasStored = localStorage.getItem('fx_customerEmail') && localStorage.getItem('fx_customerId');
        const successMsg = hasStored
          ? `✅ <strong>Bam! Message sent!</strong><br>We’ll get back to you shortly at <span>${email}</span>. You may close this window or wait for it to reset.`
          : `✅ Message sent! We’ll get back to you shortly. You may close this window or wait for it to reset.`;

        showBubble(successMsg, 'bot');

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close';
        closeBtn.className = 'btn-inline-close';
        closeBtn.addEventListener('click', closeWizard);

        const msg = document.createElement('div');
        msg.className = 'chat-msg messagex-bot';
        msg.appendChild(closeBtn);
        thread.appendChild(msg);
        thread.scrollTop = thread.scrollHeight;

        resetTimeoutId = setTimeout(() => {
          if (wizard.classList.contains('active')) location.reload();
        }, 60000);
      } else {
        console.error('Zoho error', body);
        showBubble('❌ Oops, failed to save. Try again.', 'bot');
      }
    } catch (err) {
      console.error('Network error', err);
      showBubble('❌ Network error. Please try again.', 'bot');
    }
  });

  btnClose.addEventListener('click', () => {
    const confirmClose = confirm("Are you sure you want to close?");
    if (confirmClose) closeWizard();
  });

  btnRestart.addEventListener('click', () => openWizard(Object.keys(configs).find(k => configs[k] === state.cfg)));
  btnClear.addEventListener('click', () => { input.value = ''; input.focus(); });

  // DISABLE overlay click-to-close entirely
  wizard.addEventListener('click', e => {
    e.stopPropagation();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeWizard();
    trapFocus(e);
    if (e.key === 'Enter' && document.activeElement === input && !e.shiftKey) {
      e.preventDefault();
      if (!btnNext.disabled && btnNext.style.display !== 'none') btnNext.click();
      else if (!btnSend.disabled && btnSend.style.display !== 'none') btnSend.click();
    }
  });

  document.querySelectorAll('[data-wizard]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const key = btn.dataset.wizard;
      if (configs[key]) openWizard(key);
    });
  });
}
