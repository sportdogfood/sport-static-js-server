// fxattributes.js

console.log('fxattributes.js is loaded and ready for controlled execution.');

/**
 * Handle attributes initialization
 */
function attributesInit() {
    try {
        console.log('fxattributes.js is executing properly.');

        // Fetch the customer ID from global scope
        const customerId = window.fx_customerId;
        if (!customerId) {
            console.error("No customer ID found in window.fx_customerId.");
            return;
        }

        // Fetch FoxyCart customer attributes data
        fetchFoxyCustomerAttributes(customerId);
    } catch (error) {
        console.error('An error occurred in attributesInit:', error);
    }
}

/**
 * Fetch FoxyCart customer attributes data
 * @param {string} customerId - The customer ID
 */
async function fetchFoxyCustomerAttributes(customerId) {
    if (!customerId) {
        console.error("No customer ID provided.");
        return;
    }

    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}/attributes`;
    console.log("Fetching FoxyCart customer attributes data from URL:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("FoxyCart attributes data received:", responseData);

        if (!responseData) {
            console.error("Response data is empty or undefined.");
            return;
        }

        // Store the response data in localStorage
        localStorage.setItem("userAttributesData", JSON.stringify(responseData));
        console.log("FoxyCart attributes data stored in localStorage under 'userAttributesData'.");

        // Process the attributes
        processAttributesData(responseData);

    } catch (error) {
        console.error("Error fetching data from FoxyCart Attributes API:", error);
    }
}

/**
 * Process the fetched attributes data
 * @param {object} data - The fetched attributes data
 */
function processAttributesData(data) {
    try {
        // Assuming the attributes are in data.attributes array
        const attributes = data.attributes;
        if (!attributes || !Array.isArray(attributes)) {
            console.error("Attributes data is missing or not in expected format.");
            return;
        }

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
        console.error('An error occurred while processing attributes data:', error);
    }
}

/**
 * Helper function to get friendly date and time
 * @returns {string} - Current date and time in a readable format
 */
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Attach the init function to the global window object for external access
window.attributesInit = attributesInit;

// Initialize only when explicitly called
// Example usage: window.attributesInit();
