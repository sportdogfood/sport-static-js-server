// wizard.js
export function initMultiWizard(configs) {
  const wizard   = document.querySelector('.chat-wizard');
  const heading  = document.getElementById('wizard-heading');
  const thread   = document.getElementById('wizardThread');
  const input    = document.getElementById('wizard-input');
  const btnNext  = document.getElementById('wizard-submit');
  const btnClose = document.getElementById('wizard-close');
  const btnRestart = document.getElementById('wizard-restart');
  const btnClear = document.getElementById('input-clear');

  let state = { data:{}, idx:0, cfg:null };

  function showBubble(txt, who) {
    const d = document.createElement('div');
    d.className = 'chat-msg ' + (who==='bot'?'messagex-bot':'messagex-user');
    d.innerText = txt;
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
  }

  function showStep() {
    const s = state.cfg.steps[state.idx];
    // show typing…
    const t = document.createElement('div');
    t.className = 'chat-msg messagex-bot';
    t.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    thread.appendChild(t);
    thread.scrollTop = thread.scrollHeight;

    setTimeout(()=>{
      t.remove();
      const promptText = typeof s.prompt==='function'
        ? s.prompt(state)
        : s.prompt;
      showBubble(promptText,'bot');
      input.placeholder    = s.placeholder||'';
      input.type           = s.key==='password'?'password':'text';
      btnNext.textContent  = s.confirm?'Send':'Next';
      input.style.display  = s.confirm?'none':'block';
      btnNext.style.display= s.confirm?'inline-flex':'none';
      input.value = '';
      input.disabled = false;
      if (!s.confirm) input.focus();
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
    wizard.addEventListener('transitionend', function cb(e){
      if(e.propertyName==='transform'){
        wizard.removeEventListener('transitionend', cb);
        showStep();
      }
    });
  }

  // Attach to all triggers
  document.querySelectorAll('[data-wizard]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const key = btn.dataset.wizard;
      if (!configs[key]) return;
      state.cfg = configs[key];
      resetWizard();
    });
  });

  btnNext.addEventListener('click', e=>{
    e.preventDefault();
    const s = state.cfg.steps[state.idx];
    const v = input.value.trim();
    if (s.confirm) {
      showBubble('Yes, '+state.cfg.title.toLowerCase()+' it','user');
      const form = document.getElementById(state.cfg.formId);
      Object.entries(state.data).forEach(([k,val])=>{
        const fld = form.querySelector('#wizard-'+k);
        if(fld) fld.value = val;
      });
      form.submit();
      showBubble('✅ Done!','bot');
      return;
    }
    if (!v || (s.validate && !s.validate(v))) {
      input.classList.add('shake');
      return;
    }
    state.data[s.key] = v;
    showBubble(v,'user');
    state.idx++;
    showStep();
  });

  btnClear.addEventListener('click', () => {
    input.value = '';
    input.focus();
  });
  btnRestart.addEventListener('click', resetWizard);
  btnClose.addEventListener('click', ()=>{
    wizard.classList.remove('active');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  });
}
