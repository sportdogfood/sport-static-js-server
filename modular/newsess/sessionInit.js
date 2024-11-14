// sessionInit.js

import { getFriendlyDateTime, generateRandom4DigitNumber } from './sessionUtils.js';

/**
 * Session Initialization Module
 * Responsible for initializing session-related data and setting default values.
 */
const sessionInit = {
    /**
     * Initialize the session on application startup.
     */
    init() {
        console.log('[sessionInit] Initializing session.');
        this.loadSessionData();
        this.setupDefaultState();
        this.saveToLocalStorage();
        console.log('[sessionInit] Session initialization completed.');
    },

    /**
     * Load session data from localStorage if available.
     */
    loadSessionData() {
        console.log('[sessionInit] Loading session data from localStorage.');
        const storedUserMeta = localStorage.getItem('userMeta');
        const storedUserState = localStorage.getItem('userState');
        const storedUserSession = localStorage.getItem('userSession');
        const storedFxCustomerId = localStorage.getItem('fx_customerId');
        const storedFxCustomerEm = localStorage.getItem('fx_customer_em');

        window.userMeta = storedUserMeta ? JSON.parse(storedUserMeta) : {};
        window.userState = storedUserState ? JSON.parse(storedUserState) : { state: 'visitor', subState: '' };
        window.userSession = storedUserSession ? JSON.parse(storedUserSession) : {};
        window.fx_customerId = storedFxCustomerId || null;
        window.fx_customer_em = storedFxCustomerEm || null;

        console.log('[sessionInit] Loaded session data:', {
            userMeta: window.userMeta,
            userState: window.userState,
            userSession: window.userSession,
            fx_customerId: window.fx_customerId,
            fx_customer_em: window.fx_customer_em
        });
    },

    /**
     * Set up default session state if not already set.
     */
    setupDefaultState() {
        console.log('[sessionInit] Setting up default session state.');

        if (!window.userState || typeof window.userState !== 'object') {
            window.userState = { state: 'visitor', subState: '' };
            console.log('[sessionInit] Default userState set:', window.userState);
        }

        if (!window.userMeta || typeof window.userMeta !== 'object') {
            window.userMeta = {};
            console.log('[sessionInit] Default userMeta set:', window.userMeta);
        }

        if (!window.userSession || typeof window.userSession !== 'object') {
            window.userSession = {
                lastUpdated: getFriendlyDateTime(),
                sessionId: generateRandom4DigitNumber(),
                sessionState: {
                    timeStarted: getFriendlyDateTime(),
                    secondsSpent: 0
                }
            };
            console.log('[sessionInit] Default userSession set:', window.userSession);
        } else {
            // Update lastUpdated timestamp
            window.userSession.lastUpdated = getFriendlyDateTime();
            console.log('[sessionInit] Updated userSession.lastUpdated:', window.userSession.lastUpdated);
        }
    },

    /**
     * Save the current session state to localStorage.
     */
    saveToLocalStorage() {
        console.log('[sessionInit] Saving session data to localStorage.');
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userState', JSON.stringify(window.userState));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        localStorage.setItem('fx_customerId', window.fx_customerId || '');
        localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
        console.log('[sessionInit] Session data saved to localStorage.');
    }
};

export default sessionInit;
