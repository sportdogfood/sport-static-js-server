// tracking.js

import sessionMakeCookies from './sessionMakeCookies.js';

function setTrackingCookie() {
    sessionMakeCookies.setCustomCookie({
        name: 'tracking_id',
        value: generateUniqueId(),
        days: 365,
        path: '/',
        secure: true,
        sameSite: 'Lax'
    });
}
