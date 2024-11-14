// sessionPageLo.js

import { getFriendlyDateTime } from './sessionUtils.js';
import sessionEnrich from './sessionEnrich.js'; // Import if needed for enrichment
import sessionTimer from './sessionTimer.js';   // Import if needed for timing

/**
 * Session Page Load Module
 * Responsible for handling session-related activities tied to page loads,
 * such as tracking page views, capturing page-specific metadata, and integrating
 * with other session modules to enrich session data based on user navigation.
 */
const sessionPageLo = {
    /**
     * Initialize Page Load-related functionalities.
     * This method should be called during the application's initialization phase.
     */
    init() {
        console.log('[sessionPageLo] Initializing Page Load module.');
        this.trackPageLoad();
        this.setupPageLoadListener();
        console.log('[sessionPageLo] Page Load module initialization completed.');
    },

    /**
     * Track the initial page load when the application starts.
     */
    trackPageLoad() {
        const pageData = this.getPageData();
        this.updateSessionWithPageData(pageData);
        console.log('[sessionPageLo] Initial page load tracked:', pageData);
    },

    /**
     * Set up an event listener to track subsequent page loads (e.g., in Single Page Applications).
     * This can be customized based on the routing library or framework you're using.
     */
    setupPageLoadListener() {
        // Example for Single Page Applications (SPA) using history API
        window.addEventListener('popstate', () => {
            const pageData = this.getPageData();
            this.updateSessionWithPageData(pageData);
            console.log('[sessionPageLo] Page load tracked via popstate:', pageData);
        });

        // MutationObserver example to detect DOM changes indicating page navigation
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const pageData = this.getPageData();
                    this.updateSessionWithPageData(pageData);
                    console.log('[sessionPageLo] Page load tracked via MutationObserver:', pageData);
                    break; // Prevent multiple triggers for a single navigation
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[sessionPageLo] Page load listeners set up.');
    },

    /**
     * Retrieve relevant data about the current page.
     * @returns {object} - An object containing page-related data.
     */
    getPageData() {
        return {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer || 'Direct',
            timestamp: getFriendlyDateTime(),
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash
            // Add more page-specific data as needed
        };
    },

    /**
     * Update the session data with the current page's information.
     * This method integrates with other session modules to enrich the session.
     * @param {object} pageData - The data related to the current page.
     */
    updateSessionWithPageData(pageData) {
        // Example: Update userMeta with the latest page data
        window.userMeta = {
            ...window.userMeta,
            lastPage: pageData.url,
            pageHistory: window.userMeta.pageHistory || [],
            pageHistory: [...(window.userMeta.pageHistory || []), {
                url: pageData.url,
                title: pageData.title,
                timestamp: pageData.timestamp
            }]
        };

        // Example: Enrich session data based on page-specific information
        sessionEnrich.enrichSessionData(pageData);

        // Example: Update session timer based on page navigation
        sessionTimer.resetTimer();

        // Save updated session data to localStorage
        this.saveSessionData();

        // Dispatch a custom event indicating that a new page has been loaded
        const pageLoadEvent = new CustomEvent('pageLoaded', { detail: pageData });
        window.dispatchEvent(pageLoadEvent);
    },

    /**
     * Save the current session state to localStorage.
     */
    saveSessionData() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        console.log('[sessionPageLo] Session data saved to localStorage:', {
            userMeta: window.userMeta,
            userSession: window.userSession
        });
    }
};

export default sessionPageLo;
