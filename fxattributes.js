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

        // If userZoom does not exist or does not have attributes, initialize an empty object
        if (!userZoom || typeof userZoom !== 'object') {
            console.warn('UserZoom data is missing, initializing an empty userZoom object.');
            userZoom = { _embedded: { 'fx:attributes': [] } };
            localStorage.setItem('userZoom', JSON.stringify(userZoom));
        }

        if (!userZoom._embedded || !userZoom._embedded['fx:attributes']) {
            // If attributes are still missing after initializing userZoom, mark as empty
            userZoom._embedded['fx:attributes'] = [];
            localStorage.setItem('userZoom', JSON.stringify(userZoom));
            console.info('User attributes not found. Initialized with an empty attributes array.');
        }

        // Process the attributes if they exist
        const attributes = userZoom._embedded['fx:attributes'];
        const processedAttributes = []; // Array to store processed attributes
        let totalItems = 0;

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
        console.log("Attributes have been successfully processed and stored in userSession.");

        // Save processed attributes to a new localStorage key: `userAttributesProcessed`
        const userAttributesProcessed = {
            attributes: processedAttributes.length > 0 ? processedAttributes : [],
            lastUpdated: getFriendlyDateTime(),
            totalItems: totalItems,
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
