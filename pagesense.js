// Function to push PageSense data globally with custom variables
window.pushPagesense = function(event, fx_customerId) {
  try {
    // Throttling mechanism to avoid repeated rapid calls
    if (!window.pushPagesenseThrottle) {
      window.pushPagesenseThrottle = {};
    }

    if (window.pushPagesenseThrottle[event]) {
      console.warn(`Throttling Pagesense action: ${event}`);
      return;
    }

    window.pushPagesenseThrottle[event] = true;
    setTimeout(() => {
      window.pushPagesenseThrottle[event] = false;
    }, 5000);

    // Retrieve customer data from localStorage
    let customerData = localStorage.getItem('userSession');

    if (!customerData) {
      console.warn('No customer data found in localStorage under userSession');
      return;
    }

    // Parse customer data once and use throughout
    let customer = JSON.parse(customerData);

    // Extract required fields from parsed customer data
    const firstName = customer.userCustomer?.firstName || customer.fx_first_name || '';
    const lastName = customer.userCustomer?.lastName || customer.fx_last_name || '';
    const email = customer.userCustomer?.email || customer.fx_email || '';
    const geoIP = customer.userGeo?.geoIP || customer.geoIP || '';
    const geoCity = customer.userGeo?.geoCity || customer.geoCity || '';

    // Ensure that firstName, lastName, and email exist
    if (firstName && lastName && email) {
      window.pagesense = window.pagesense || [];
      window.pagesense.push([event, {
        customerId: fx_customerId,
        email: email,
        geoIP: geoIP,
        geoCity: geoCity,
        eventName: event
      }]);

      if (window.$zoho && window.$zoho.salesiq) {
        window.$zoho.salesiq.visitor.name(`${firstName} ${lastName}`);
        window.$zoho.salesiq.visitor.email(email);
      }

      // Avoid logging duplicate events in userEvents
      customer.userEvents = customer.userEvents || [];
      const lastEvent = customer.userEvents.slice(-1)[0];
      if (!lastEvent || lastEvent.eventName !== event || Date.now() - new Date(lastEvent.timestamp).getTime() >= 5000) {
        customer.userEvents.push({
          eventName: event,
          timestamp: new Date().toISOString(),
          customerId: fx_customerId,
          email: email,
          geoIP: geoIP,
          geoCity: geoCity
        });

        // Save updated customer data back to localStorage only once at the end
        localStorage.setItem('userSession', JSON.stringify(customer));
      }
    } else {
      console.warn('Required customer details are missing (first name, last name, email).');
    }
  } catch (error) {
    console.error('Failed to parse customer data from localStorage', error);
  }
};
