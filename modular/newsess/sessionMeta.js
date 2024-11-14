// sessionMeta.js

import { getFriendlyDateTime } from './sessionUtils.js';

/**
 * Session Meta Module
 * Responsible for managing metadata-related functionalities, including loading external scripts.
 */
const sessionMeta = {
    /**
     * Load the EvaluateCustomerState script dynamically.
     */
    async loadEvaluateCustomerStateScript() {
        const scriptId = 'evaluatecustomerstate-script';
        const scriptSrc = 'https://sportdogfood.github.io/sport-static-js-server/evaluatecustomerstate.js';

        // Check if the script is already loaded or is in the process of loading
        if (document.getElementById(scriptId)) {
            console.log(`[sessionMeta] ${scriptId} is already loaded.`);
            return;
        }

        if (window.evaluateCustomerStateLoading) {
            console.log('[sessionMeta] EvaluateCustomerState script is currently loading.');
            return;
        }

        window.evaluateCustomerStateLoading = true;

        const scriptElement = document.createElement('script');
        scriptElement.src = scriptSrc;
        scriptElement.id = scriptId;
        scriptElement.async = true;

        scriptElement.onload = () => {
            console.log('[sessionMeta] EvaluateCustomerState script loaded successfully.');
            window.evaluateCustomerStateLoaded = true;
            window.evaluateCustomerStateLoading = false;
        };

        scriptElement.onerror = () => {
            console.error('[sessionMeta] Failed to load EvaluateCustomerState script.');
            window.evaluateCustomerStateLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log('[sessionMeta] Attempting to load EvaluateCustomerState script dynamically.');
    },

    /**
     * Load the PageSense script dynamically.
     */
    async loadPageSenseScript() {
        const scriptId = 'pagesense-script';
        const scriptSrc = 'https://sportdogfood.github.io/sport-static-js-server/session-pagesense.js';

        // Check if the script is already loaded or is in the process of loading
        if (document.getElementById(scriptId)) {
            console.log(`[sessionMeta] ${scriptId} is already loaded.`);
            return;
        }

        if (window.pagesenseScriptLoading) {
            console.log('[sessionMeta] PageSense script is currently loading.');
            return;
        }

        window.pagesenseScriptLoading = true;

        const scriptElement = document.createElement('script');
        scriptElement.src = scriptSrc;
        scriptElement.id = scriptId;
        scriptElement.async = true;

        scriptElement.onload = () => {
            console.log('[sessionMeta] PageSense script loaded successfully from session-pagesense.js.');
            window.pagesenseScriptLoaded = true;
            window.pagesenseScriptLoading = false;
        };

        scriptElement.onerror = () => {
            console.error('[sessionMeta] Failed to load PageSense script from session-pagesense.js.');
            window.pagesenseScriptLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log('[sessionMeta] Attempting to load PageSense script dynamically from session-pagesense.js.');
    },

    /**
     * Additional metadata-related functionalities can be added here.
     * For example, managing metadata attributes, handling metadata events, etc.
     */
};

export default sessionMeta;
