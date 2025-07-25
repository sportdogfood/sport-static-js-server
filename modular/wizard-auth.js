// wizard-auth.js

import sessionAuth from "https://sms.sportdogfood.com/js/modules/sessionAuth.js";
import { initMultiWizard } from "./wizard.js";

const authConfigs = {
  login: {
    title: "Login",
    steps: [
      {
        key:    "email",
        prompt: "Enter your email:",
        placeholder: "you@example.com",
        validate: v => v.includes("@")
      },
      {
        key:    "password",
        prompt: "Enter your password:",
        placeholder: "••••••••",
        type:   "password",
        validate: v => v.length >= 6
      },
      {
        key:     "confirm",
        prompt:  "Submit login?",
        confirm: true
      }
    ],
    // custom submit handler instead of hidden form
    onConfirm: async (state, showBubble, closeWizard, resetWizard) => {
      showBubble("Logging in…", "bot");
      try {
        const ok = await sessionAuth.authenticateCustomer(
          state.data.email,
          state.data.password
        );
        if (ok) {
          showBubble(`✅ Welcome back, ${state.data.email}!`, "bot");
          // keep open for 5s then close
          setTimeout(closeWizard, 5000);
        } else {
          showBubble("❌ Email or password incorrect.", "bot");
          // roll back one step to retry password
          state.idx = 1;
          setTimeout(() => resetWizard(state), 600);
        }
      } catch (err) {
        showBubble("❌ Unexpected error. Try again.", "bot");
        state.idx = 1;
        setTimeout(() => resetWizard(state), 600);
      }
    }
  },
  reset: {
    title: "Reset Password",
    steps: [
      {
        key:    "email",
        prompt: "Enter your email to reset:",
        placeholder: "you@example.com",
        validate: v => v.includes("@")
      },
      {
        key:     "confirm",
        prompt:  st => `Send reset link to ${st.data.email}?`,
        confirm: true
      }
    ],
    onConfirm: async (state, showBubble, closeWizard, resetWizard) => {
      showBubble("Sending reset link…", "bot");
      try {
        const resp = await fetch(
          "https://sportcorsproxy.herokuapp.com/foxycart/customer/forgot_password",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: state.data.email })
          }
        );
        if (resp.ok) {
          showBubble(
            `✅ If ${state.data.email} exists, a reset link has been sent.`,
            "bot"
          );
          setTimeout(closeWizard, 5000);
        } else {
          const body = await resp.json().catch(() => ({}));
          showBubble(
            `❌ ${body.error || "Error sending reset. Try again."}`,
            "bot"
          );
          state.idx = 0;
          setTimeout(() => resetWizard(state), 600);
        }
      } catch (err) {
        showBubble("❌ Network error. Try again.", "bot");
        state.idx = 0;
        setTimeout(() => resetWizard(state), 600);
      }
    }
  }
};

// initialize both flows
document.addEventListener("DOMContentLoaded", () => {
  initMultiWizard(authConfigs);

  // trigger buttons for auth
  document.querySelectorAll("[data-wizard]").forEach(btn => {
    btn.addEventListener("click", e => {
      const key = btn.dataset.wizard;
      if (authConfigs[key]) {
        // programmatically open the wizard
        const openEvent = new CustomEvent("wizard-open", { detail: key });
        document.dispatchEvent(openEvent);
      }
    });
  });
});
