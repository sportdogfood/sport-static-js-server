// dashboard.js

const TASKS = [
  {
    key: "update-billing",
    label: "Update Billing Address",
    desc: "Change your billing address for future orders.",
    icon: "🏠",
    formFields: [
      { label: "Street Address", name: "billing_address", type: "text", required: true },
      { label: "City", name: "billing_city", type: "text", required: true },
      { label: "State", name: "billing_state", type: "text", required: true },
      { label: "ZIP", name: "billing_zip", type: "text", required: true }
    ],
    apiAction: "updateBillingAddress"
  },
  {
    key: "update-shipping",
    label: "Update Shipping Address",
    desc: "Edit your default shipping address.",
    icon: "🚚",
    formFields: [
      { label: "Street Address", name: "shipping_address", type: "text", required: true },
      { label: "City", name: "shipping_city", type: "text", required: true },
      { label: "State", name: "shipping_state", type: "text", required: true },
      { label: "ZIP", name: "shipping_zip", type: "text", required: true }
    ],
    apiAction: "updateShippingAddress"
  },
  {
    key: "update-payment",
    label: "Update Payment Method",
    desc: "Change your saved card for upcoming charges.",
    icon: "💳",
    formFields: [
      { label: "Card Number", name: "card_number", type: "text", required: true },
      { label: "Expiration Date", name: "card_exp", type: "text", required: true },
      { label: "CVV", name: "card_cvv", type: "password", required: true }
    ],
    apiAction: "updatePayment"
  },
  // ...add more tasks like Order Again, Track Order, etc
];

// Main entry point: call this after DOM loaded
export function initDashboard(targetId = 'pwr-dashboard-container') {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = `
    <div class="pwr-dashboard-panel">
      <h2 class="pwr-dashboard-title">Manage Your Account</h2>
      <div class="pwr-dashboard-pills">
        ${TASKS.map(task => `
          <button class="pwr-dashboard-pill" data-key="${task.key}">
            <span class="pwr-dashboard-pill-icon">${task.icon}</span>
            <span>
              <span class="pwr-dashboard-pill-label">${task.label}</span>
              <span class="pwr-dashboard-pill-desc">${task.desc}</span>
            </span>
          </button>
        `).join('')}
      </div>
      <div id="pwr-dashboard-taskbox" class="pwr-dashboard-taskbox"></div>
    </div>
  `;

  // Handler: Click a pill, show its form
  root.querySelectorAll('.pwr-dashboard-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const task = TASKS.find(t => t.key === key);
      if (task) showTaskForm(task, root.querySelector('#pwr-dashboard-taskbox'));
    });
  });
}

// Show the form for a selected task
function showTaskForm(task, container, userData = {}) {
  container.innerHTML = `
    <form id="pwr-dashboard-form" class="pwr-task-form" autocomplete="off">
      <h3 class="pwr-task-form-title">${task.label}</h3>
      <div class="pwr-task-fields">
        ${task.formFields.map(field => `
          <label class="pwr-task-label">
            <span>${field.label}</span>
            <input class="pwr-task-input"
                   type="${field.type}"
                   name="${field.name}"
                   required="${field.required ? 'required' : ''}"
                   value="${userData[field.name] || ''}">
          </label>
        `).join('')}
      </div>
      <button type="submit" class="pwr-suggestion-pill pwr-task-submit-btn">Update Now</button>
      <button type="button" id="pwr-dashboard-task-cancel" class="pwr-answer-close" style="position:absolute;top:.7rem;right:1.2rem;">&times;</button>
      <div id="pwr-task-form-status" class="pwr-task-form-status"></div>
      <div class="pwr-support-fallback" style="margin-top:.9em">
        <a href="/support" class="pwr-link">Contact Support</a>
      </div>
    </form>
  `;

  container.style.display = 'block';

  // Cancel button
  container.querySelector('#pwr-dashboard-task-cancel').onclick = () => {
    container.innerHTML = '';
  };

  // Form submission
  const form = container.querySelector('#pwr-dashboard-form');
  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      const status = container.querySelector('#pwr-task-form-status');
      status.textContent = "Updating...";
      status.style.opacity = 1;

      // Gather form data
      const data = {};
      task.formFields.forEach(field => {
        data[field.name] = form.elements[field.name].value;
      });

      // TODO: Replace below with real API POST to your proxy
      setTimeout(() => {
        status.textContent = "✅ Update successful!";
        status.style.opacity = 1;
        status.style.color = "#69e5ff";
        setTimeout(() => { status.style.opacity = 0; }, 2000);
      }, 900);
    };
  }
}
