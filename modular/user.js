// user.js
import { getLastUpdated } from './utils.js';

/**
 * Evaluate user based on cookies, localStorage, and geolocation data
 * @param {object} cookies - Parsed cookies
 * @param {object} geoData - Geolocation data
 */
export function evaluateUser(cookies, geoData) {
    console.log('Evaluating user...');

    // Update window.userMeta with data from cookies
    window.userMeta = {
        ...window.userMeta,
        lastUpdated: getLastUpdated(),
        fx_customerId: cookies['fx_customerId'] || null,
        fx_customer_em: cookies['fx_customer_em'] || null,
        // Add other cookie data as needed
    };

    // Update window.userMeta with geolocation data
    if (geoData) {
        window.userMeta.geoData = geoData;
    }

    // Determine user authentication status
    if (cookies['fx_customer_sso'] && cookies['fx_customerId']) {
        window.userAuth = 'authenticated';
        window.userState.state = 'customer';
        window.userState.subState = 'user-logged-in';
    } else {
        window.userAuth = '';
        window.userState.state = 'visitor';
        window.userState.subState = '';
    }

    // Dispatch userStateChanged event
    const event = new CustomEvent('userStateChanged', { detail: window.userState });
    window.dispatchEvent(event);

    console.log('User evaluation completed:', window.userState, window.userAuth);
}
