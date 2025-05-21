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

  // Answer/Typed and Modal logic unchanged
  function showTaskAnswer(task) {
    txt.textContent = '';
    box.style.display = 'block';
    starter.style.display = 'none';
    list.style.display = 'none';
    new window.Typed(txt, {
      strings: [task.answer],
      typeSpeed: 19,
      showCursor: false,
      contentType: 'html',
      onComplete: () => {
        // Modal link
        const link = box.querySelector('.pwr-action-link');
        if (link) {
          link.onclick = (e) => {
            e.preventDefault();
            showTaskModal(task);
          };
        }
      }
    });
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
