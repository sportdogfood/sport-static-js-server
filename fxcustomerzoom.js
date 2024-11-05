// Log to confirm script execution 
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

            // Retrieve existing userZoom from localStorage
            let existingUserZoom = JSON.parse(localStorage.getItem("userZoom")) || {};

            // Check if attributesProcessed already exists in userZoom
            if (existingUserZoom._embedded?.['fx:attributesProcessed']) {
                console.info('Attributes have already been processed in userZoom. Keeping existing attributes.');
                responseData._embedded['fx:attributesProcessed'] = existingUserZoom._embedded['fx:attributesProcessed'];
            }

            // Store updated customer data in localStorage
            localStorage.setItem("userZoom", JSON.stringify(responseData));

            // Dispatch an event to indicate userZoom is ready
            document.dispatchEvent(new Event('userZoomReady'));

            // Safely call initializeAndUpdate if it exists
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            if (typeof window.updateUserSession === 'function') {
                window.updateUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });
            } else {
                console.error('updateUserSession function not found in global scope.');
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
function customerzoomInit() {
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
window.customerzoomInit = customerzoomInit;

// Attach other relevant functions to the window for external access
window.fetchCustomerData = fetchCustomerData;

// Make sure updateUserSession is globally available
if (typeof window.updateUserSession !== 'function') {
    window.updateUserSession = function(updateObject) {
        let currentSession = JSON.parse(localStorage.getItem("userSession")) || {};
        
        // Log to check current session before updating
        console.log("Current userSession before update:", currentSession);
        
        // Iterate through updateObject and update the session
        for (const key in updateObject) {
            if (updateObject.hasOwnProperty(key)) {
                currentSession[key] = updateObject[key];
            }
        }

        // Save updated session back to localStorage
        localStorage.setItem("userSession", JSON.stringify(currentSession));

        // Also update window.thisUser object
        window.thisUser = {
            ...window.thisUser,
            ...updateObject
        };
        
        // Log to check the final state after the update
        console.log("Updated userSession:", currentSession);
        console.log("Updated window.thisUser:", window.thisUser);
    };
}

// Ensure the initialization function is called when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Attempting to call customerzoomInit after DOM content is loaded.');
    if (typeof window.customerzoomInit === 'function') {
        window.customerzoomInit();
    } else {
        console.error('customerzoomInit function not found during DOMContentLoaded.');
    }
});

// Event listener to trigger subscriptions, attributes, and transactions initialization after userZoom is ready
document.addEventListener('userZoomReady', () => {
    console.log('UserZoom is fully loaded. Triggering fxsubscriptions, fxattributes, and fxtransactions initialization.');

    if (typeof window.subscriptionsInit === 'function') {
        try {
            window.subscriptionsInit();
            console.log('subscriptionsInit function executed successfully.');
        } catch (error) {
            console.error('Error executing subscriptionsInit:', error);
        }
    } else {
        console.error('subscriptionsInit function not found in global scope.');
    }

    if (typeof window.attributesInit === 'function') {
        try {
            window.attributesInit();
            console.log('attributesInit function executed successfully.');
        } catch (error) {
            console.error('Error executing attributesInit:', error);
        }
    } else {
        console.error('attributesInit function not found in global scope.');
    }

    if (typeof window.transactionsInit === 'function') {
        try {
            window.transactionsInit();
            console.log('transactionsInit function executed successfully.');
        } catch (error) {
            console.error('Error executing transactionsInit:', error);
        }
    } else {
        console.error('transactionsInit function not found in global scope.');
    }
});

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString('en-US', { timeZone: 'America/New_York' });
}
