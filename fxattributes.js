
fxattributesjs
// Function to handle user attributes with a single controlled execution
function attributesInit(retryCount = 0) {
    try {
        // Read from localStorage with retry mechanism
        const userZoomRaw = localStorage.getItem('userZoom');
        if (!userZoomRaw) {
            if (retryCount < 3) { // Retry up to 3 times
                console.warn(`Attempt ${retryCount + 1}: UserZoom data not available yet, retrying...`);
                setTimeout(() => attributesInit(retryCount + 1), 500); // Retry after 500 ms
            } else {
                console.error('UserZoom data not available after multiple retries. Initialization aborted.');
            }
            return;
        }

        // Parse userZoom data
        let userZoom = JSON.parse(userZoomRaw);

        // Check if userZoom and attributes are available
        if (!userZoom || !userZoom._embedded?.['fx:attributes']) {
            if (retryCount < 3) { // Retry up to 3 times for embedded attributes
                console.warn(`Attempt ${retryCount + 1}: User attributes not available, retrying...`);
                setTimeout(() => attributesInit(retryCount + 1), 500); // Retry after 500 ms
            } else {
                console.error('User attributes are not available after multiple retries. Initialization aborted.');
            }
            return;
        }

        // Check if attributes have already been processed to avoid re-execution
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