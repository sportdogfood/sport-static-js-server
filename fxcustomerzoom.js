console.log('fxcustomerzoom.js is executing properly.');

// Define the fetchCustomerData function
async function fetchCustomerData(customerId) {
    const zoomParams = 'attributes,default_billing_address,default_shipping_address,default_payment_method'; 
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}?zoom=${encodeURIComponent(zoomParams)}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData) {
            console.log('Customer data:', responseData);

            // Store customer data in localStorage
            localStorage.setItem("thisUserZoom", JSON.stringify(responseData));
            updateUserState('Zoom', 'available');

            // Safely call initializeAndUpdate if it exists
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            updateThisUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });

             // Call pushPagesense with customerId
             pushPagesense(customerId);
             
        } else {
            console.error('No customer data received');
        }
    } catch (error) {
        console.error('Error fetching customer data:', error);
        throw error; // Ensure the error is caught and retry logic can be applied
    }
}


// Define the main initialization function for customer zoom
function customerZoomInit() {
    console.log('fxcustomerzoom.js initialization function is called.');

    // Ensure that the customer ID is available before proceeding
    const customerId = window.fx_customerId;
    if (!customerId) {
        console.error('No customer ID found. Cannot initialize customer zoom.');
        return;
    }

    // Fetch customer data using the defined function
    fetchCustomerData(customerId)
      .then(() => {
        console.log('Customer data successfully fetched and processed.');
      })
      .catch((error) => {
        console.error('Error during customer data initialization:', error);
      });
}

// Attach the initialization function to the global window object
window.customerZoomInit = customerZoomInit;
