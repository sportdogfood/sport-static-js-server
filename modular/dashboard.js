// dashboard.js
import { TASKS } from './dashboard-data.js';

export function initDashboard() {
  // DOM
  const input   = document.getElementById('pwr-prompt-input');
  const send    = document.getElementById('pwr-send-button');
  const clear   = document.getElementById('pwr-clear-button');
  const list    = document.getElementById('pwr-suggestion-list');
  const box     = document.getElementById('pwr-answer-output');
  const txt     = document.getElementById('pwr-answer-text');
  const x       = box.querySelector('.pwr-answer-close');
  const starter = document.getElementById('pwr-initial-suggestions');
  const modalOverlay = document.getElementById('pwr-modal-overlay');
  const modalClose   = document.getElementById('pwr-modal-close');
  const modalContent = document.getElementById('pwr-modal-content');

  // Fuzzy search
  const fuse = new window.Fuse(TASKS, {
    keys: ['question', 'trigger'],
    threshold: 0.36,
    distance: 48
  });

  // Pills: only fill input (do not show answer yet)
  function renderStarterPills() {
    starter.innerHTML = '';
    TASKS.forEach(task => {
      const pill = document.createElement('a');
      pill.href = '#';
      pill.className = 'pwr-suggestion-pill';
      pill.innerHTML = `
        <span class="pwr-pill-icon">${task.icon}</span>
        <span class="pwr-pill-content"><span class="pwr-pill-title">${task.question}</span></span>
      `;
      pill.addEventListener('click', e => {
        e.preventDefault();
        input.value = task.question;
        send.style.display = clear.style.display = 'block';
        list.style.display = 'none';
        // No answer revealed here!
      });
      starter.appendChild(pill);
    });
    starter.style.display = 'flex';
  }
  renderStarterPills();

  // Typeahead (suggestion list): only fill input (do not show answer yet)
  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    list.style.display = 'none';
    send.style.display = clear.style.display = q ? 'block' : 'none';
    if (!q) { starter.style.display = 'flex'; return; }
    const results = fuse.search(q).slice(0, 5);
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'no-results';
      li.textContent = 'No results found';
      list.appendChild(li);
    } else {
      results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r.item.question;
        li.onclick = () => {
          input.value = r.item.question;
          send.style.display = clear.style.display = 'block';
          list.style.display = 'none';
          // No answer revealed here!
        };
        list.appendChild(li);
      });
    }
    list.style.display = 'block';
    starter.style.display = 'none';
  });

  // Send/Enter triggers answer (Typed.js)
  send.onclick = function() {
    const q = input.value.trim();
    if (!q) return;
    const res = fuse.search(q);
    if (res.length) return showTaskAnswer(res[0].item);
    txt.textContent = '';
    box.style.display = 'block';
    starter.style.display = 'none';
    list.style.display = 'none';
    new window.Typed(txt, { strings: ["Sorry, I couldn't find that task."], typeSpeed: 20, showCursor: false });
  };

  input.addEventListener('keydown', e => { if (e.key === 'Enter') send.click(); });

  // Clear button and close answer
  clear.onclick = x.onclick = function() {
    input.value = '';
    box.style.display = 'none';
    txt.textContent = '';
    list.style.display = 'none';
    starter.style.display = 'flex';
  };

 function showTaskModal(task) {
  const modalOverlay = document.getElementById('pwr-modal-overlay');
  const modalContent = document.getElementById('pwr-modal-content');
  const modalClose   = document.getElementById('pwr-modal-close');
  modalOverlay.style.display = 'flex';
  modalContent.innerHTML = task.form;

  // --- 1. Get user data (customerId required!) ---
  const customerId = window.userData && window.userData.customerId;
  if (customerId && task.endpoint) {
    // 2. Fetch endpoint and pre-fill fields (support different forms by key)
    fetch(task.endpoint.replace('{customerId}', customerId))
      .then(r => r.json())
      .then(data => {
        // Now map Foxy API fields to your form field names
        if (task.key === "update-billing") {
          modalContent.querySelector('[name="address"]').value = data.address1 || '';
          modalContent.querySelector('[name="city"]').value    = data.city     || '';
          modalContent.querySelector('[name="state"]').value   = data.region   || '';
          modalContent.querySelector('[name="zip"]').value     = data.postal_code || '';
        } else if (task.key === "update-shipping") {
          modalContent.querySelector('[name="address"]').value = data.address1 || '';
          modalContent.querySelector('[name="city"]').value    = data.city     || '';
          modalContent.querySelector('[name="state"]').value   = data.region   || '';
          modalContent.querySelector('[name="zip"]').value     = data.postal_code || '';
        }
        // Add similar mapping for payment, etc, if endpoint returns those
      })
      .catch(() => {
        const status = modalContent.querySelector('#pwr-form-status');
        if (status) status.textContent = "Could not fetch current info. Please try again.";
      });
  }

  // --- 3. Modal close handler ---
  modalClose.onclick = () => {
    modalOverlay.style.display = 'none';
    modalContent.innerHTML = '';
  };

  // --- 4. Submit handler (leave as is, or integrate with Webflow/Zoho Flow) ---
  const form = modalContent.querySelector('form');
  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      // You can post/patch to Webflow, Zoho Flow, or Foxy proxy here
      // For now, just show fake success
      const status = modalContent.querySelector('#pwr-form-status');
      status.textContent = "Updating...";
      setTimeout(() => { status.textContent = "✅ Update successful!"; }, 1000);
    };
  }
}


  function showTaskModal(task) {
    modalContent.innerHTML = task.form;
    modalOverlay.style.display = 'flex';
    modalClose.onclick = () => {
      modalOverlay.style.display = 'none';
      modalContent.innerHTML = '';
    };
    const form = modalContent.querySelector('form');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        const status = modalContent.querySelector('#pwr-form-status');
        status.textContent = "Updating...";
        setTimeout(() => { status.textContent = "✅ Update successful!"; }, 1000);
      };
    }
  }
}
