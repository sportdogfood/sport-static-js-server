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

            // Store customer data in localStorage
            localStorage.setItem("fxcustomerzoom", JSON.stringify(responseData));

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
function fxcustomerzoomInit() {
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
window.fxcustomerzoomInit = fxcustomerzoomInit;

// Attach other relevant functions to the window for external access
window.fetchCustomerData = fetchCustomerData;

// Make sure updateUserSession is globally available
if (typeof window.updateUserSession !== 'function') {
    window.updateUserSession = function(updateObject) {
        // Check if userSession exists in localStorage, otherwise initialize it
        let currentSession = JSON.parse(localStorage.getItem("userSession")) || {};
        
        // Log to check current session before updating
        console.log("Current userSession before update:", currentSession);
        
        // Iterate through updateObject and update the session
        for (const key in updateObject) {
            if (updateObject.hasOwnProperty(key)) {
                currentSession[key] = updateObject[key];
            }
        }

        // Log the object that is about to be updated
        console.log("Updating userSession with:", updateObject);
        
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
    console.log('Attempting to call fxcustomerzoomInit after DOM content is loaded.');
    if (typeof window.fxcustomerzoomInit === 'function') {
        window.fxcustomerzoomInit();
    } else {
        console.error('fxcustomerzoomInit function not found during DOMContentLoaded.');
    }
});
