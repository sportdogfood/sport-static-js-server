console.log('fxattributes.js is executing properly.');

// Function to handle user attributes with a single controlled execution
function attributesInit() {
    try {
        // Ensure `userZoom` and `fx_customerId` are available before proceeding
        if (!window.userZoom || !window.fx_customerId) {
            console.warn('UserZoom or fx_customerId not available. attributesInit will not run.');
            return;
        }

        // Read userZoom data from localStorage
        const userZoomRaw = localStorage.getItem('userZoom');
        if (!userZoomRaw) {
            console.error('UserZoom data not found in localStorage. Initialization aborted.');
            return;
        }

        // Parse userZoom data
        let userZoom = JSON.parse(userZoomRaw);

        // Verify userZoom contains the attributes required
        if (!userZoom || typeof userZoom !== 'object' || !userZoom._embedded?.['fx:attributes']) {
            console.error('User attributes are not available in userZoom. Initialization aborted.');
            return;
        }

        // Avoid re-processing if attributes are already processed
        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};
        if (userSession['attributesProcessed'] || userZoom._embedded?.['fx:attributesProcessed']) {
            console.info('Attributes have already been processed. Skipping re-execution.');
            return;
        }

        // Process the attributes and add them to userSession and userZoom
        const attributes = userZoom._embedded['fx:attributes'];
        const processedAttributes = []; // Array to store processed attributes for userZoom

        attributes.forEach((attribute) => {
            const name = attribute?.name || '';
            const value = attribute?.value ?? null;

            const attributeData = {
                attributeName: name,
                attributeValue: value,
                lastupdate: getFriendlyDateTime(),
            };

            // Add to userSession
            userSession[`userAttribute_${name}`] = attributeData;

            // Add to processedAttributes for userZoom
            processedAttributes.push(attributeData);
        });

        // Mark attributes as processed in userSession
        userSession['attributesProcessed'] = true;

        // Update session in localStorage
        localStorage.setItem('userSession', JSON.stringify(userSession));
        console.log("Attributes have been successfully processed and stored in userSession.");

        // Add fx:attributesProcessed to userZoom._embedded
        userZoom._embedded['fx:attributesProcessed'] = processedAttributes;

        // Update userZoom in localStorage
        localStorage.setItem('userZoom', JSON.stringify(userZoom));
        console.log("Attributes have been successfully processed and added to userZoom.");

    } catch (error) {
        console.error('An error occurred in attributesInit:', error);
    }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Make sure the init function is available globally if needed
window.attributesInit = attributesInit;

// Remove any automatic triggering to ensure attributesInit is only run when explicitly called
// attributesInit should only be run when fxcustomerzoom.js calls it explicitly
