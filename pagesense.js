// Function to push PageSense data globally with custom variables
window.pushPagesense = function(event, fx_customerId) {
  try {
    // Retrieve customer data from localStorage
    let customerData = localStorage.getItem('userSession');

    // Check if customer data is available
    if (!customerData) {
      console.warn('No customer data found in localStorage under userSession');
      return;
    }

    // Parse the customer data
    let customer = JSON.parse(customerData);

    // Extract required fields from parsed customer data
    const firstName = customer.userCustomer?.firstName || customer.fx_first_name || '';
    const lastName = customer.userCustomer?.lastName || customer.fx_last_name || '';
    const email = customer.userCustomer?.email || customer.fx_email || '';
    const geoIP = customer.userGeo?.geoIP || customer.geoIP || '';
    const geoCity = customer.userGeo?.geoCity || customer.geoCity || '';

    // Ensure that firstName, lastName, and email exist
    if (firstName && lastName && email) {
      // Integrate with PageSense
      window.pagesense = window.pagesense || [];

      // Track event with custom attributes (including event name itself)
      window.pagesense.push([event, {
        customerId: fx_customerId, // Track customerId with the event
        email: email,
        geoIP: geoIP,
        geoCity: geoCity,
        eventName: event // Adding event name as a custom variable
      }]);

      // Update SalesIQ visitor information if available
      if (window.$zoho && window.$zoho.salesiq) {
        window.$zoho.salesiq.visitor.name(`${firstName} ${lastName}`);
        window.$zoho.salesiq.visitor.email(email);
      }

      // Log the event in userEvents
      customer.userEvents = customer.userEvents || [];
      customer.userEvents.push({
        eventName: event,
        timestamp: new Date().toISOString(),
        customerId: fx_customerId,
        email: email,
        geoIP: geoIP,
        geoCity: geoCity
      });

      // Save updated customer data back to localStorage
      localStorage.setItem('userSession', JSON.stringify(customer));
      
    } else {
      console.warn('Required customer details are missing (first name, last name, email).');
    }
  } catch (error) {
    console.error('Failed to parse customer data from localStorage', error);
  }
};
