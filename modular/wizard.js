export function initMultiWizard(configs) {
  // DOM references
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

  // Prevent click‐outside from closing
  wizard.addEventListener('click', e => e.stopPropagation());

  // Only X button closes, with confirm
  btnClose.onclick = () => {
    if (confirm("Are you sure you want to close?")) closeWizard();
  };

  // Delegate inline‐Send clicks
  thread.addEventListener('click', e => {
    if (e.target.id === 'wizard-send-inline') {
      e.preventDefault();
      btnSend.click();
    }
  });

  // State
  let state = { data: {}, idx: 0, cfg: null, cfgKey: null };
  let lastFocus          = null;
  let resetTimeoutId     = null;
  let transitionFallbackId = null;
  const TRANSITION_DURATION = 400;

  // Helpers
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
    return str.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Render current step
  function showStep() {
    if (!state.cfg) return;
    const s = state.cfg.steps[state.idx];
    showTyping();
    setTimeout(() => {
      removeTyping();

      // Build prompt
      let promptText = typeof s.prompt === 'function' ? s.prompt(state) : s.prompt;
      if (s.key === 'message' && !state.data.firstName) {
        // generic if no name
        promptText = 'What’s your message?';
      } else if (s.confirm) {
        promptText += ` <button id="wizard-send-inline" class="pwr4-inline-send">Send</button>`;
      }

      showBubble(promptText, 'bot');

      // Configure input / button bar
      input.placeholder = s.placeholder || '';
      input.type        = s.key === 'password' ? 'password' : 'text';
      input.value       = '';
      input.disabled    = false;
      input.classList.remove('shake');

      if (s.confirm) {
        input.style.display   = 'none';
        btnNext.style.display = 'none';
        btnSend.style.display = 'inline-flex';
        btnSend.disabled      = false;
      } else {
        input.style.display   = '';
        btnNext.style.display = 'inline-flex';
        btnNext.disabled      = true;
        btnSend.style.display = 'none';
        input.focus();
      }
    }, TRANSITION_DURATION);
  }

 function openWizard(rawKey) {
  const key = String(rawKey).toLowerCase();
  const matchKey = Object.keys(configs).find(k => k.toLowerCase() === key);
  if (!matchKey) {
    console.error('Wizard: no config for', rawKey);
    return;
  }
  state.cfgKey = matchKey;
  state.cfg    = configs[matchKey];

  // Pre‐fill from localStorage
  const storedEmail  = localStorage.getItem('fx_customerEmail');
  const storedId     = localStorage.getItem('fx_customerId');  // <-- always the Foxy ID you want
  const storedRegion = localStorage.getItem('userRegion');

  state.data = {};
  if (storedEmail && storedId) {
    state.data.firstName = ''; // Set later by step
    state.data.email     = storedEmail;
    state.data.foxy_id   = storedId; // <-- Always lower-case in JS!
    if (storedRegion) state.data.region = storedRegion;
    // skip to message
    const idx = state.cfg.steps.findIndex(s => s.key === 'message');
    state.idx = idx > -1 ? idx : 0;
  } else {
    state.idx = 0;
  }

  thread.innerHTML    = '';
  heading.innerText   = state.cfg.title;
  lastFocus           = document.activeElement;
  wizard.setAttribute('aria-hidden','false');
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  wizard.classList.add('active');

  setTimeout(() => input.focus(), TRANSITION_DURATION + 10);

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
    wizard.setAttribute('aria-hidden','true');
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
    const first = focusable[0], last = focusable[focusable.length-1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // Input validity
  input.addEventListener('input', () => {
    if (!state.cfg) return;
    const s     = state.cfg.steps[state.idx];
    const valid = input.value.trim() && (!s.validate || s.validate(input.value));
    if (btnNext.style.display !== 'none') btnNext.disabled = !valid;
    if (btnSend.style.display !== 'none') btnSend.disabled = !valid;
  });

  // Next
  btnNext.addEventListener('click', e => {
    if (!state.cfg) return;
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
  if (!state.cfg) return;
  e.preventDefault();
  btnSend.disabled = true;

  // Always use "Threads" module
  const moduleName = 'CustomModule48';

  // Field mappings with fallbacks
  const email      = state.data.email || state.data.customer_email || '';
  const firstName  = state.data.firstName || state.data.first_name || '';
  const foxy_id    = state.data.foxy_id || '';
  const region     = state.data.region || '';
  const message    = state.data.message || '';
  const name       = 'Wizard Contact';

  // Build payload
  const payload = {
    Name: name,          // Always "Wizard Contact"
    Email: email,
    Message: message,
    First_Name: firstName,
    Foxy_id: foxy_id,
    Region: region
  };

  // Sync hidden form fields (for Webflow native submission if needed)
  [
    ['wizard-name',    firstName],
    ['wizard-email',   email],
    ['wizard-message', message],
    ['wizard-foxy_id', foxy_id],
    ['wizard-region',  region]
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  // --- Optimistic Success: show to user immediately, don't wait for POST ---
  const hasRequired = !!(email && firstName);
  const successText = hasRequired
    ? `✅ Bam! Message sent! We'll get back to you shortly at <span>${email}</span>.`
    : `✅ Message sent! We'll get back to you shortly.`;

  // Create the styled success bubble (always .success class)
  const successBubble = document.createElement('div');
  successBubble.className = 'chat-msg messagex-bot success';
  successBubble.innerHTML = successText;

  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'Close';
  closeBtn.className = 'pwr4-inline-close';
  closeBtn.addEventListener('click', closeWizard);

  successBubble.appendChild(closeBtn);
  thread.appendChild(successBubble);
  thread.scrollTop = thread.scrollHeight;

  // Immediately auto-close after 60s if still open
  resetTimeoutId = setTimeout(() => {
    if (wizard.classList.contains('active')) closeWizard();
  }, 60000);

  // --- Background POST ---
  try {
    const resp = await fetch(
      `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/${moduleName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    const body = await resp.json();
    if (!resp.ok || !body.data) throw new Error(JSON.stringify(body));
    // Optionally: admin notification or logging here
  } catch (err) {
    console.error('[Wizard] Background POST error:', err);
  }
  // UI is not affected by POST errors. User always sees immediate success.
});



// Restart
btnRestart.addEventListener('click', () => {
  if (state.cfgKey) openWizard(state.cfgKey);
});

// Clear
btnClear.addEventListener('click', () => {
  input.value = '';
  input.focus();
});

  // Keyboard handling
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeWizard();
    trapFocus(e);
    if (e.key === 'Enter' && document.activeElement === input && !e.shiftKey) {
      e.preventDefault();
      if (!btnNext.disabled && btnNext.style.display !== 'none') btnNext.click();
      else if (!btnSend.disabled && btnSend.style.display !== 'none') btnSend.click();
    }
  });

  // Trigger buttons
  document.querySelectorAll('[data-wizard]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openWizard(btn.getAttribute('data-wizard'));
    });
  });
}
