// dashboard.js (FAQ-style, standalone)
const TASKS = [
  {
    key: "update-billing",
    question: "How do I update my billing address?",
    trigger: ["update billing address", "change billing", "edit billing"],
    icon: "🏠",
    answer: "To update your billing address, <a href='#' class='pwr-action-link' data-action='update-billing'>click here</a>.",
    form: `
      <h3>Update Billing Address</h3>
      <form id="pwr-form-billing">
        <label>Street Address<input name="address" required></label>
        <label>City<input name="city" required></label>
        <label>State<input name="state" required></label>
        <label>ZIP<input name="zip" required></label>
        <button type="submit" class="pwr-suggestion-pill" style="margin-top:1em;">Update Now</button>
      </form>
      <div id="pwr-form-status"></div>
    `
  },
  {
    key: "update-shipping",
    question: "How do I update my shipping address?",
    trigger: ["update shipping", "edit shipping", "change shipping address"],
    icon: "🚚",
    answer: "To update your shipping address, <a href='#' class='pwr-action-link' data-action='update-shipping'>click here</a>.",
    form: `
      <h3>Update Shipping Address</h3>
      <form id="pwr-form-shipping">
        <label>Street Address<input name="address" required></label>
        <label>City<input name="city" required></label>
        <label>State<input name="state" required></label>
        <label>ZIP<input name="zip" required></label>
        <button type="submit" class="pwr-suggestion-pill" style="margin-top:1em;">Update Now</button>
      </form>
      <div id="pwr-form-status"></div>
    `
  },
  {
    key: "update-payment",
    question: "How do I update my payment method?",
    trigger: ["update payment", "change card", "edit payment method"],
    icon: "💳",
    answer: "To update your payment method, <a href='#' class='pwr-action-link' data-action='update-payment'>click here</a>.",
    form: `
      <h3>Update Payment Method</h3>
      <form id="pwr-form-payment">
        <label>Card Number<input name="card_number" required></label>
        <label>Expiration Date<input name="exp" required></label>
        <label>CVV<input name="cvv" required></label>
        <button type="submit" class="pwr-suggestion-pill" style="margin-top:1em;">Update Now</button>
      </form>
      <div id="pwr-form-status"></div>
    `
  },
  // Add more tasks as needed...
];

// Utility: Fuzzy search on questions and triggers
const fuse = new window.Fuse(TASKS, {
  keys: ['question', 'trigger'],
  threshold: 0.36,
  distance: 48
});

// DOM refs
const input   = document.getElementById('pwr-prompt-input');
const send    = document.getElementById('pwr-send-button');
const clear   = document.getElementById('pwr-clear-button');
const list    = document.getElementById('pwr-suggestion-list');
const box     = document.getElementById('pwr-answer-output');
const txt     = document.getElementById('pwr-answer-text');
const x       = box.querySelector('.pwr-answer-close');
const starter = document.getElementById('pwr-initial-suggestions');

// Modal
const modalOverlay = document.getElementById('pwr-modal-overlay');
const modalClose   = document.getElementById('pwr-modal-close');
const modalContent = document.getElementById('pwr-modal-content');

// Show pills for each task
function renderStarterPills() {
  starter.innerHTML = '';
  TASKS.forEach(task => {
    const pill = document.createElement('a');
    pill.href = '#';
    pill.className = 'pwr-suggestion-pill';
    pill.innerHTML = `
      <span class="pwr-pill-icon">${task.icon}</span>
      <span class="pwr-pill-content">
        <span class="pwr-pill-title">${task.question}</span>
      </span>
    `;
    pill.addEventListener('click', e => {
      e.preventDefault();
      showTaskAnswer(task);
    });
    starter.appendChild(pill);
  });
  starter.style.display = 'flex';
}
renderStarterPills();

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
      // Attach modal action handler
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
  // Bind close
  modalClose.onclick = () => {
    modalOverlay.style.display = 'none';
    modalContent.innerHTML = '';
  };
  // Example handler (fake success)
  const form = modalContent.querySelector('form');
  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      const status = modalContent.querySelector('#pwr-form-status');
      status.textContent = "Updating...";
      setTimeout(() => {
        status.textContent = "✅ Update successful!";
      }, 1000);
    };
  }
}

// Typeahead search
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
        showTaskAnswer(r.item);
        list.style.display = 'none';
      };
      list.appendChild(li);
    });
  }
  list.style.display = 'block';
  starter.style.display = 'none';
});

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
clear.onclick = x.onclick = function() {
  input.value = '';
  box.style.display = 'none';
  txt.textContent = '';
  list.style.display = 'none';
  starter.style.display = 'flex';
};
input.addEventListener('keydown', e => { if (e.key === 'Enter') send.click(); });
