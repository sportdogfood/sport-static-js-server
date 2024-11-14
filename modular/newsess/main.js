// main.js

import {
    sessionInit,
    sessionMeta,
    sessionIAM,
    sessionPageLo,
    sessionPageLoEl,
    sessionEnrich,
    sessionTimer,
    sessionGeo,
    sessionCookies,
    sessionMakeCookies,
    sessionAuth,
    sessionEnd,
    sessionFC,
    sendSessionWebhook
} from './sessionManager.js';
import { setupUIEventListeners } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize essential session modules in the correct order
    sessionInit.init();                // Initialize session data
    sessionMeta.loadEvaluateCustomerStateScript(); // Load EvaluateCustomerState script
    sessionMeta.loadPageSenseScript(); // Load PageSense script
    sessionGeo.geoInit();              // Initialize geolocation
    sessionIAM.iamInit();              // Initialize IAM-related functionalities
    sessionTimer.startTimerInit();     // Initialize session timer
    sessionPageLo.pageInit();          // Initialize page load-related functionalities
    sessionPageLoEl.pageLoElInit();    // Initialize page load element-related functionalities
    sessionEnrich.enrichInit();        // Initialize session enrichment
    sessionCookies.cookiesInit();      // Initialize cookie management
    sessionMakeCookies.makeCookieInit(); // Initialize cookie creation
    sessionAuth.authInit();            // Initialize authentication
    sessionEnd.endInit();              // Initialize session end functionalities
    sessionFC.init();                   // Initialize FC module

    // Setup idle detection
    if (typeof sessionTimer.setupIdleDetection === 'function') {
        sessionTimer.setupIdleDetection(); 
    } else {
        console.warn('setupIdleDetection function not found in sessionTimer.');
    }

    // Setup UI event listeners
    setupUIEventListeners();

    // Start session assist polling if necessary
    if (typeof sessionTimer.startSessionAssistPolling === 'function') {
        sessionTimer.startSessionAssistPolling(); 
    } else {
        console.warn('startSessionAssistPolling function not found in sessionTimer.');
    }

    // Start polling or other asynchronous tasks
    // Add any additional initialization as needed
});
