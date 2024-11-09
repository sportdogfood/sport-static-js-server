// fxattributes.js

console.log('fxattributes.js is loaded and ready for controlled execution.');

/**
 * Handle attributes initialization
 */
function attributesInit(retryCount = 3) {
    try {
        console.log('fxattributes.js is executing properly.');

        // Fetch the customer ID from global scope
        const customerId = window.fx_customerId;
        if (!customerId) {
            if (retryCount > 0) {
                console.warn(`No customer ID found in window.fx_customerId. Retrying in 500ms... Attempts left: ${retryCount}`);
                setTimeout(() => attributesInit(retryCount - 1), 500); // Retry after 500ms
            } else {
                console.error("No customer ID found after multiple attempts.");
            }
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
async function fetchFoxyCustomerAttributes(customerId, retryCount = 3) {
    if (!customerId) {
        console.error("No customer ID provided.");
        return;
    }

    // Updated API URL to conform to the new server route
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/fxattributes/${encodeURIComponent(customerId)}`;
    console.log("Fetching FoxyCart customer attributes data from URL:", apiUrl);


    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Include any additional headers if required, e.g., authentication tokens
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("FoxyCart attributes data received:", responseData);

        if (!responseData || !responseData._embedded || !responseData._embedded.attributes) {
            console.error("Response data is empty or not in the expected HAL format.");
            return;
        }

        // Extract the attributes array from the HAL response
        const attributes = responseData._embedded.attributes;

        // Store the response data in localStorage
        localStorage.setItem("userAttributesData", JSON.stringify(attributes));
        console.log("FoxyCart attributes data stored in localStorage under 'userAttributesData'.");

        // Process the attributes
        processAttributesData(attributes);

    } catch (error) {
        console.error("Error fetching data from FoxyCart Attributes API:", error);

        if (retryCount > 0) {
            console.log(`Retrying fetch. Attempts left: ${retryCount}`);
            setTimeout(() => fetchFoxyCustomerAttributes(customerId, retryCount - 1), 1000); // Retry after 1 second
        } else {
            console.error("All retry attempts failed.");
        }
    }
}

/**
 * Process the fetched attributes data
 * @param {Array} attributes - The fetched attributes data from the HAL response
 */
function processAttributesData(attributes) {
    try {
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
