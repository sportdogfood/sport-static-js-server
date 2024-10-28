// Script 3: Embedded Data Management, Initialization, and Loading Scripts

// Helper function to update _embedded data in localStorage
function updateEmbeddedData(key, data) {
    let userZoom = JSON.parse(localStorage.getItem('userZoom')) || {};

    if (!userZoom._embedded) {
        userZoom._embedded = {};
    }

    userZoom._embedded[key] = data;

    // Log the update for visibility
    console.log(`Updating _embedded with key: ${key}, data:`, data);

    // Update the localStorage
    localStorage.setItem('userZoom', JSON.stringify(userZoom));

    // Set a new localStorage item to confirm the update (for debugging purposes)
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}

// Attach `updateEmbeddedData` to `window` to make it globally accessible
window.updateEmbeddedData = updateEmbeddedData;

// Event listener for 'authenticated' event
// Load additional scripts to further enhance user session after authentication

document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerZoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' }
    ];

    scriptsToLoad.forEach(scriptInfo => {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Executing ${scriptInfo.initFunction} function.`);
                    window[scriptInfo.initFunction](); // Call the initialization function defined in each script
                } else {
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load ${scriptInfo.id}.js`);
            };

            if (document.body) {
                document.body.appendChild(scriptElement);
            } else {
                console.error("document.body is null, unable to append script element.");
            }
        } else {
            console.log(`${scriptInfo.id}.js is already loaded`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                window[scriptInfo.initFunction](); // Call the initialization function in case the script was loaded but not initialized
            } else {
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
            }
        }
    });
});

// Ensure that fetchCustomerData is defined. Placeholder function:
async function fetchCustomerData(customerId) {
    console.log(`Fetching additional data for customer ID: ${customerId}`);
    // Implement the actual data fetching logic here
}

// Remove undefined function calls or define them as needed
// For example, if initializeAndRun is required, define it:
function initializeAndRun(context) {
    console.log(`Initializing and running context: ${context}`);
    // Implement the actual initialization logic here
}

// Ensure that findCustomer is defined if it's being used
function findCustomer(jwtToken) {
    console.log(`Finding customer with JWT token: ${jwtToken}`);
    // Implement the actual find customer logic here
}
