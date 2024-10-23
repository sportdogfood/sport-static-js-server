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
            
            if (typeof window.updateUserState === 'function') {
                window.updateUserState('Zoom', 'available');
            } else {
                console.error('updateUserState function not found in global scope.');
            }

            // Safely call initializeAndUpdate if it exists
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            if (typeof window.updateThisUserSession === 'function') {
                window.updateThisUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });
            } else {
                console.error('updateThisUserSession function not found in global scope.');
            }

            // Call pushPagesense with customerId
            if (typeof window.pushPagesense === 'function') {
                window.pushPagesense('login', customerId);
            } else {
                console.error('pushPagesense function not found in global scope.');
            }

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

// Attach other relevant functions to the window for external access
window.fetchCustomerData = fetchCustomerData;

// Make sure updateThisUserSession is globally available
if (typeof window.updateThisUserSession !== 'function') {
    window.updateThisUserSession = function(updateObject) {
        // Check if thisUser exists in localStorage, otherwise initialize it
        let currentSession = JSON.parse(localStorage.getItem("thisUserSession")) || {};
        
        // Log to check current session before updating
        console.log("Current thisUserSession before update:", currentSession);
        
        // Iterate through updateObject and update the session
        for (const key in updateObject) {
            if (updateObject.hasOwnProperty(key)) {
                currentSession[key] = updateObject[key];
            }
        }

        // Log the object that is about to be updated
        console.log("Updating thisUserSession with:", updateObject);
        
        // Save updated session back to localStorage
        localStorage.setItem("thisUserSession", JSON.stringify(currentSession));

        // Also update window.thisUser object
        window.thisUser = {
            ...window.thisUser,
            ...updateObject
        };
        
        // Log to check the final state after the update
        console.log("Updated thisUserSession:", currentSession);
        console.log("Updated window.thisUser:", window.thisUser);
    };
}
