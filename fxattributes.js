console.log('fxattributes.js is loaded and ready for controlled execution.');

// Function to handle user attributes with a single controlled execution
function attributesInit() {
    try {
        console.log('fxattributes.js is executing properly.');

        // Assume that the userZoom and related data are valid, as this function should only run when explicitly called by fxcustomerzoom.js
        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};
        let userZoom = JSON.parse(localStorage.getItem('userZoom'));

        // Avoid re-processing if attributes are already processed
        if (userSession['attributesProcessed']) {
            console.info('Attributes have already been processed. Skipping re-execution.');
            return;
        }

        if (!userZoom || typeof userZoom !== 'object' || !userZoom._embedded?.['fx:attributes']) {
            console.warn('User attributes are not available in userZoom. Initialization will not proceed.');
            return;
        }

        // Process the attributes and add them to userSession
        const attributes = userZoom._embedded['fx:attributes'];
        const processedAttributes = []; // Array to store processed attributes

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

            // Add to processedAttributes array
            processedAttributes.push(attributeData);
        });

        // Mark attributes as processed in userSession
        userSession['attributesProcessed'] = true;

        // Update session in localStorage without overwriting other properties
        localStorage.setItem('userSession', JSON.stringify(userSession));
        console.log("Attributes have been successfully processed and stored in userSession.");

        // Save processed attributes to a new localStorage key: `userAttributesProcessed`
        const userAttributesProcessed = {
            attributes: processedAttributes,
            lastUpdated: getFriendlyDateTime(),
        };
        localStorage.setItem('userAttributesProcessed', JSON.stringify(userAttributesProcessed));
        console.log("Attributes have been successfully processed and stored in userAttributesProcessed.");

    } catch (error) {
        console.error('An error occurred in attributesInit:', error);
    }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Attach the init function to the global window object for external access
window.attributesInit = attributesInit;

// Removed any internal guards or checks to ensure this function will only be executed when explicitly called
// fxcustomerzoom.js should call the function like this:
// attributesInit();
