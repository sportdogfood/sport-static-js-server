// Function to push PageSense data globally with custom variables
window.pushPagesense = function(event, fx_customerId) {
    try {
      // Retrieve customer data from localStorage
      const customerData = localStorage.getItem('thisUserSession');
  
      // Check if customer data is available
      if (!customerData) {
        console.warn('No customer data found in localStorage under thisUserSession');
        return;
      }
  
      // Parse the customer data
      const customer = JSON.parse(customerData);
  
      // Extract required fields from localStorage
      const firstName = customer.fx_first_name || '';
      const lastName = customer.fx_last_name || '';
      const email = customer.fx_email || '';
  
      // Ensure that firstName, lastName, and email exist
      if (firstName && lastName && email) {
        // Integrate with PageSense
        window.pagesense = window.pagesense || [];
  
        // Identify user with email and custom attributes like customerId, firstName, and lastName
        window.pagesense.push(['identifyUser', email, {
          customerId: fx_customerId, // Pass custom variable
          firstName: firstName,
          lastName: lastName
        }]);
  
        // Track event with custom attributes (if needed)
        window.pagesense.push([event, {
          customerId: fx_customerId, // Track customerId with the event
          email: email
        }]);
  
        // Integrate with SalesIQ if available
        if (window.$zoho && window.$zoho.salesiq) {
          window.$zoho.salesiq.visitor.name(`${firstName} ${lastName}`);
          window.$zoho.salesiq.visitor.email(email);
        }
      } else {
        console.warn('Required customer details are missing (first name, last name, email).');
      }
    } catch (error) {
      console.error('Failed to parse customer data from localStorage', error);
    }
  };
  