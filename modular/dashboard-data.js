// dashboard-data.js
export const TASKS = [
  {
    key: "update-billing",
    question: "How do I update my billing address?",
    trigger: ["update billing address", "change billing", "edit billing", "billing"],
  endpoint: "/foxycart/customers/{customerId}/default_billing_address", 
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
    trigger: ["update shipping address", "change shipping", "edit shipping", "shipping"],
 endpoint: "/foxycart/customers/{customerId}/default_shipping_address", 
    icon: "📦",
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
    trigger: ["update payment", "change card", "update credit card", "edit payment", "payment"],
 endpoint: "/foxycart/customers/{customerId}/default_payment_method", 

    icon: "💳",
    answer: "To update your payment method, <a href='#' class='pwr-action-link' data-action='update-payment'>click here</a>.",
    form: `
      <h3>Update Payment Method</h3>
      <form id="pwr-form-payment">
        <label>Name on Card<input name="name" required></label>
        <label>Card Number<input name="card" required></label>
        <label>Expiration<input name="exp" required></label>
        <label>CVV<input name="cvv" required></label>
        <button type="submit" class="pwr-suggestion-pill" style="margin-top:1em;">Update Now</button>
      </form>
      <div id="pwr-form-status"></div>
    `
  },
  // ...and so on for your other dashboard actions/tasks
];
