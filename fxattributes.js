// fxAttributes.js

// Function to handle user attributes
function fxAttributesInit() {
    try {
        const userZoom = JSON.parse(localStorage.getItem('userZoom'));
        if (!userZoom || !userZoom._embedded?.['fx:attributes']) {
            throw new Error('User attributes not available');
        }
        const attributes = userZoom._embedded['fx:attributes'];

        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};

        attributes.forEach((attribute) => {
            const name = attribute?.name || '';
            const value = attribute?.value ?? null;

            const attributeData = {
                attributeName: name,
                attributeValue: value,
                lastupdate: getFriendlyDateTime(),
            };

            userSession[`userAttribute_${name}`] = attributeData;
        });

        // Update session
        localStorage.setItem('userSession', JSON.stringify(userSession));
    } catch (error) {
        console.error('An error occurred in fxAttributesInit:', error);
    }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Make sure the init function is available globally if needed
window.fxAttributesInit = fxAttributesInit;
