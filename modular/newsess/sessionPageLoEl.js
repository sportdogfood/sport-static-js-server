// sessionPageLoEl.js

import { getFriendlyDateTime } from './sessionUtils.js';
import sessionEnrich from './sessionEnrich.js'; // Import if enrichment is needed
import sessionTimer from './sessionTimer.js';   // Import if timing adjustments are needed

/**
 * Session Page Load Elements Module
 * Responsible for managing session-related activities tied to specific page elements,
 * such as tracking visibility, user interactions, and updating session data accordingly.
 */
const sessionPageLoEl = {
    /**
     * Initialize Page Load Elements-related functionalities.
     * This method should be called during the application's initialization phase.
     */
    init() {
        console.log('[sessionPageLoEl] Initializing Page Load Elements module.');
        this.trackCriticalElements();
        this.setupElementInteractionListeners();
        console.log('[sessionPageLoEl] Page Load Elements module initialization completed.');
    },

    /**
     * Track the visibility and presence of critical UI elements on the page.
     * This can include elements like navigation bars, modals, or any other important components.
     */
    trackCriticalElements() {
        const criticalElements = [
            { selector: '#navigationBar', name: 'Navigation Bar' },
            { selector: '#loginModal', name: 'Login Modal' },
            { selector: '#signupForm', name: 'Signup Form' },
            // Add more critical elements as needed
        ];

        criticalElements.forEach(elementInfo => {
            const element = document.querySelector(elementInfo.selector);
            if (element) {
                const isVisible = this.isElementVisible(element);
                this.updateSessionWithElementData(elementInfo.name, isVisible);
                console.log(`[sessionPageLoEl] Tracked element '${elementInfo.name}': Visible = ${isVisible}`);
            } else {
                console.warn(`[sessionPageLoEl] Critical element '${elementInfo.name}' not found using selector '${elementInfo.selector}'.`);
            }
        });
    },

    /**
     * Setup event listeners to monitor user interactions with critical elements.
     * This can include clicks, form submissions, hovers, etc.
     */
    setupElementInteractionListeners() {
        const interactiveElements = [
            { selector: '#loginButton', event: 'click', name: 'Login Button' },
            { selector: '#signupButton', event: 'click', name: 'Signup Button' },
            { selector: '#searchInput', event: 'input', name: 'Search Input' },
            // Add more interactive elements as needed
        ];

        interactiveElements.forEach(elementInfo => {
            const element = document.querySelector(elementInfo.selector);
            if (element) {
                element.addEventListener(elementInfo.event, (event) => {
                    this.handleElementInteraction(elementInfo.name, event);
                });
                console.log(`[sessionPageLoEl] Event listener added for '${elementInfo.name}' on event '${elementInfo.event}'.`);
            } else {
                console.warn(`[sessionPageLoEl] Interactive element '${elementInfo.name}' not found using selector '${elementInfo.selector}'.`);
            }
        });
    },

    /**
     * Handle interactions with specific elements and update session data accordingly.
     * @param {string} elementName - The name of the interacted element.
     * @param {Event} event - The event object.
     */
    handleElementInteraction(elementName, event) {
        console.log(`[sessionPageLoEl] Interaction detected on '${elementName}':`, event.type);
        
        // Example: Update session data with interaction details
        window.userMeta = {
            ...window.userMeta,
            elementInteractions: window.userMeta.elementInteractions || {},
            elementInteractions: {
                ...window.userMeta.elementInteractions,
                [elementName]: {
                    lastInteracted: getFriendlyDateTime(),
                    interactionType: event.type,
                    // Add more interaction details as needed
                }
            }
        };

        // Example: Enrich session data based on interaction
        sessionEnrich.enrichSessionData({ elementName, interactionType: event.type });

        // Example: Reset session timer on interaction
        sessionTimer.resetTimer();

        // Save updated session data to localStorage
        this.saveSessionData();

        // Optionally, dispatch a custom event for other modules to listen to
        const interactionEvent = new CustomEvent('elementInteracted', { detail: { elementName, interactionType: event.type, timestamp: getFriendlyDateTime() } });
        window.dispatchEvent(interactionEvent);

        console.log(`[sessionPageLoEl] Session updated with interaction on '${elementName}'.`);
    },

    /**
     * Check if a given element is visible in the viewport.
     * @param {HTMLElement} element - The DOM element to check.
     * @returns {boolean} - True if the element is visible, else false.
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Update the session data with the visibility state of a specific element.
     * @param {string} elementName - The name of the element.
     * @param {boolean} isVisible - Visibility state of the element.
     */
    updateSessionWithElementData(elementName, isVisible) {
        window.userMeta = {
            ...window.userMeta,
            elementVisibility: window.userMeta.elementVisibility || {},
            elementVisibility: {
                ...window.userMeta.elementVisibility,
                [elementName]: {
                    visible: isVisible,
                    lastChecked: getFriendlyDateTime()
                }
            }
        };

        // Example: Enrich session data based on element visibility
        sessionEnrich.enrichSessionData({ elementName, isVisible });

        // Save updated session data to localStorage
        this.saveSessionData();
    },

    /**
     * Save the current session state to localStorage.
     */
    saveSessionData() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        console.log('[sessionPageLoEl] Session data saved to localStorage:', {
            userMeta: window.userMeta,
            userSession: window.userSession
        });
    }
};

export default sessionPageLoEl;
