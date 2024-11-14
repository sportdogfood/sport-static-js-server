// sessionManager.js

import sessionInit from './sessionInit.js';
import sessionMeta from './sessionMeta.js';
import sessionIAM from './sessionIAM.js';
import sessionPageLo from './sessionPageLo.js';
import sessionPageLoEl from './sessionPageLoEl.js';
import sessionEnrich from './sessionEnrich.js';
import sessionTimer from './sessionTimer.js';
import sessionGeo from './sessionGeo.js';
import sessionCookies from './sessionCookies.js';
import sessionMakeCookies from './sessionMakeCookies.js';
import sessionAuth from './sessionAuth.js';
import sessionEnd from './sessionEnd.js';
import sessionFC from './sessionFC.js'; // Newly added module
import { sendSessionWebhook } from './sessionWebhook.js'; // Imported from sessionWebhook.js

export {
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
    sessionFC, // Ensure comma separation
    sendSessionWebhook // Export if needed elsewhere
};
