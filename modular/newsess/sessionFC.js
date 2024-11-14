// sessionFC.js

import { loadAuthenticatedUserScripts } from './sessionFCUtils.js'; // Utility functions if any

const sessionFC = {
    /**
     * Initialize FC and set up event listeners
     */
    init() {
        console.log('[sessionFC] Initializing FC module.');
        this.setupFCInitialization();
    },

    /**
     * Set up FC initialization and event listeners
     */
    setupFCInitialization() {
        // Ensure FC is initialized properly before use
        window.FC = window.FC || {};
        window.is_subscription_modification = window.is_subscription_modification || false;

        // Initialize FC.onLoad
        window.FC.onLoad = () => {
            console.log('[sessionFC] FC.onLoad triggered.');
            this.setupFCClientReady();
        };

        console.log('[sessionFC] FC.onLoad set.');
    },

    /**
     * Set up FC.client.on('ready.done') event listener
     */
    setupFCClientReady() {
        if (window.FC.client && typeof window.FC.client.on === 'function') {
            window.FC.client.on('ready.done', () => {
                console.log('[sessionFC] FC.client.on("ready.done") triggered.');
                this.handleFCReady();
            });
            console.log('[sessionFC] FC.client.on("ready.done") event listener set.');
        } else {
            console.error('[sessionFC] FC.client.on is not a function. FC library may not be loaded correctly.');
        }
    },

    /**
     * Handle FC ready event
     */
    handleFCReady() {
        console.log('[sessionFC] Handling FC ready event.');
        this.retrieveFcsid();
    },

    /**
     * Retrieve fcsid from FC and store in localStorage
     */
    retrieveFcsid() {
        if (window.FC.json && window.FC.json.session_id) {
            const fcsid = window.FC.json.session_id;
            console.log('[sessionFC] Successfully retrieved fcsid:', fcsid);
            localStorage.setItem('fcsid', fcsid);
        } else {
            console.error('[sessionFC] Failed to retrieve fcsid. FC.json.session_id is not available.');
        }
    },

    /**
     * Load authenticated user scripts after successful authentication
     */
    loadAuthenticatedUserScripts() {
        console.log('[sessionFC] Loading authenticated user scripts.');
        loadAuthenticatedUserScripts();
    }
};

export default sessionFC;
