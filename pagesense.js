// Debounce function to limit the frequency of pushPagesense calls
function debounce(func, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Function to push PageSense data globally with custom variables
window.pushPagesense = (function() {
  let eventQueue = [];
  let isProcessingQueue = false;

  // Cache customer data to avoid repetitive localStorage reads
  let customerData = localStorage.getItem('userSession');
  let customer = customerData ? JSON.parse(customerData) : null;

  // Function to process the event queue
  async function processQueue() {
    if (isProcessingQueue || eventQueue.length === 0) {
      return;
    }
    isProcessingQueue = true;

    while (eventQueue.length > 0) {
      const { event, fx_customerId } = eventQueue.shift();

      try {
        // Extract required fields from cached customer data
        const firstName = customer?.userCustomer?.firstName || customer?.fx_first_name || '';
        const lastName = customer?.userCustomer?.lastName || customer?.fx_last_name || '';
        const email = customer?.userCustomer?.email || customer?.fx_email || '';
        const geoIP = customer?.userGeo?.geoIP || customer?.geoIP || '';
        const geoCity = customer?.userGeo?.geoCity || customer?.geoCity || '';

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
        console.error('Failed to process Pagesense event', error);
      }
    }

    isProcessingQueue = false;
  }

  // Function to push PageSense data with debouncing
  const debouncedProcessQueue = debounce(processQueue, 2000);

  return function(event, fx_customerId) {
    // Throttle repeated calls
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

    // Check if customer data exists
    if (!customer) {
      console.warn('No customer data found in localStorage under userSession');
      return;
    }

    // Add the event to the queue and process it
    eventQueue.push({ event, fx_customerId });
    debouncedProcessQueue();
  };
})();
