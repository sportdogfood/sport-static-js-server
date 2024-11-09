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
    
    // Retry mechanism to ensure function availability
    const retryCount = 3; // Number of retries
    let attempt = 0;
    
    function callCustomerZoomInit() {
        if (typeof window.customerzoomInit === 'function') {
            window.customerzoomInit();
        } else if (attempt < retryCount) {
            attempt++;
            console.warn('customerzoomInit function not found, retrying...');
            setTimeout(callCustomerZoomInit, 500); // Retry every 500ms
        } else {
            console.error('customerzoomInit function not found after retries.');
        }
    }
    
    callCustomerZoomInit();
});

// Event listener to trigger subscriptions, attributes, and transactions initialization after userZoom is ready
document.addEventListener('userZoomReady', () => {
    console.log('UserZoom is fully loaded. Triggering fxsubscriptions, fxattributes, and fxtransactions initialization.');

    // Fetch the userZoom data from localStorage
    const userZoomData = JSON.parse(localStorage.getItem('userZoom'));

    // Check if _embedded["fx:attributes"] exists and is not null
    if (userZoomData && userZoomData._embedded && userZoomData._embedded['fx:attributes']) {
        console.log('Processing fx:attributes found in userZoom.');

        const attributes = userZoomData._embedded['fx:attributes'];

        // Loop through each attribute and process them similar to fxattributes
        try {
            if (!attributes || !Array.isArray(attributes)) {
                console.error("Attributes data is missing or not in expected format.");
            } else {
                const userSession = JSON.parse(localStorage.getItem('userSession')) || {};
                const processedAttributes = [];
                let totalItems = 0;

                attributes.forEach((attribute) => {
                    const name = attribute?.name || '';
                    const value = attribute?.value ?? null;

                    const attributeData = {
                        attributeName: name,
                        attributeValue: value,
                        lastUpdate: getFriendlyDateTime(),
                    };

                    // Add to userSession
                    userSession[`userAttribute_${name}`] = attributeData;

                    // If the attribute name is `Zoho_CRM_ID`, set a global variable and store it in localStorage
                    if (name === 'Zoho_CRM_ID') {
                        window.fx_crmId = value;
                        localStorage.setItem('fx_crmId', value);
                        console.log(`Global fx_crmId set to: ${value}`);
                    }

                    // Add to processedAttributes array
                    processedAttributes.push(attributeData);
                    totalItems += 1;
                });

                // Mark attributes as processed in userSession
                userSession['attributesProcessed'] = true;

                // Update session in localStorage without overwriting other properties
                localStorage.setItem('userSession', JSON.stringify(userSession));
                console.log("Attributes from userZoom have been successfully processed and stored in userSession.");

                // Save processed attributes to a new localStorage key: `userAttributesProcessed`
                const userAttributesProcessed = {
                    attributes: processedAttributes.length > 0 ? processedAttributes : [],
                    lastUpdated: getFriendlyDateTime(),
                    totalItems: totalItems,
                };
                localStorage.setItem('userAttributesProcessed', JSON.stringify(userAttributesProcessed));
                console.log("Attributes from userZoom have been successfully processed and stored in userAttributesProcessed.");
            }
        } catch (error) {
            console.error('An error occurred while processing attributes data from userZoom:', error);
        }
    } else {
        console.warn("No attributes found in userZoom _embedded['fx:attributes'].");
    }

    // Execute other functions if available
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
