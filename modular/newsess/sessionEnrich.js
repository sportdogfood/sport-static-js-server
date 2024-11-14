// sessionEnrich.js

import { getFriendlyDateTime } from './sessionUtils.js';

/**
 * Session Enrich Module
 * Responsible for enriching session data with additional information
 * based on user interactions, page data, geolocation, and other contextual factors.
 */
const sessionEnrich = {
    /**
     * Initialize Enrich-related functionalities.
     * This method should be called during the application's initialization phase.
     */
    init() {
        console.log('[sessionEnrich] Initializing Enrich module.');
        // Initialize any necessary enrichment processes or listeners here
        console.log('[sessionEnrich] Enrich module initialization completed.');
    },

    /**
     * Enrich session data based on provided data.
     * This method can be called by other modules to add or update session information.
     * @param {object} data - The data based on which the session will be enriched.
     */
    enrichSessionData(data) {
        console.log('[sessionEnrich] Enriching session data with:', data);
        
        if (!window.userMeta) {
            window.userMeta = {};
            console.warn('[sessionEnrich] window.userMeta was undefined. Initialized to empty object.');
        }

        // Example: Enrich based on page data
        if (data.url) {
            window.userMeta.lastVisitedPage = data.url;
            window.userMeta.lastVisitedTime = data.timestamp;
            console.log(`[sessionEnrich] Updated lastVisitedPage to ${data.url} at ${data.timestamp}`);
        }

        // Example: Enrich based on element interactions
        if (data.elementName && data.interactionType) {
            window.userMeta.lastElementInteracted = data.elementName;
            window.userMeta.lastInteractionType = data.interactionType;
            window.userMeta.lastInteractionTime = data.timestamp;
            console.log(`[sessionEnrich] Updated last interaction with ${data.elementName} (${data.interactionType}) at ${data.timestamp}`);
        }

        // Example: Enrich based on geolocation data
        if (data.geoData) {
            window.userMeta.geoLocation = {
                latitude: data.geoData.latitude,
                longitude: data.geoData.longitude,
                city: data.geoData.city,
                country: data.geoData.country
            };
            console.log(`[sessionEnrich] Updated geoLocation to ${JSON.stringify(window.userMeta.geoLocation)}`);
        }

        // Example: Enrich based on user roles
        if (window.userRoles && window.userRoles.currentRole) {
            window.userMeta.userRole = window.userRoles.currentRole;
            console.log(`[sessionEnrich] Updated userRole to ${window.userRoles.currentRole}`);
        }

        // Add more enrichment rules as needed based on application requirements

        // After enrichment, save the updated userMeta to localStorage
        this.saveEnrichedSessionData();
    },

    /**
     * Save the enriched session data to localStorage.
     */
    saveEnrichedSessionData() {
        if (window.userMeta) {
            localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
            console.log('[sessionEnrich] Enriched session data saved to localStorage:', window.userMeta);
        } else {
            console.warn('[sessionEnrich] No userMeta found to save.');
        }
    },

    /**
     * Example method to enrich session with custom data.
     * This can be extended or modified based on specific enrichment needs.
     * @param {string} key - The key for the custom data.
     * @param {any} value - The value for the custom data.
     */
    addCustomEnrichment(key, value) {
        if (!window.userMeta) {
            window.userMeta = {};
            console.warn('[sessionEnrich] window.userMeta was undefined. Initialized to empty object.');
        }

        window.userMeta[key] = value;
        console.log(`[sessionEnrich] Added custom enrichment: ${key} = ${value}`);
        this.saveEnrichedSessionData();
    },

    /**
     * Remove specific enrichment data from the session.
     * @param {string} key - The key of the enrichment data to remove.
     */
    removeCustomEnrichment(key) {
        if (window.userMeta && window.userMeta.hasOwnProperty(key)) {
            delete window.userMeta[key];
            console.log(`[sessionEnrich] Removed custom enrichment: ${key}`);
            this.saveEnrichedSessionData();
        } else {
            console.warn(`[sessionEnrich] Cannot remove enrichment. Key '${key}' does not exist.`);
        }
    }
};

export default sessionEnrich;
