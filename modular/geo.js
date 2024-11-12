// geo.js
import { saveToLocalStorage } from './utils.js';

/**
 * Load geolocation data via fetch API
 * @returns {object|null} - Geolocation data or null on failure
 */
export async function loadGeoLocationData() {
    // Check if geolocation data is already fetched and available in userMeta
    if (window.geoDataFetched && window.userMeta?.geoData) {
        console.log("Geolocation data already fetched.");
        return window.userMeta.geoData; // Return cached geoData
    }

    try {
        const response = await fetch('https://ipv4.geojs.io/v1/ip/geo.json');
        const json = await response.json();
        console.log("Geolocation data fetched successfully:", json);

        // Construct geoData object with the necessary fields
        const geoData = {
            ip: json.ip,
            country: json.country,
            region: json.region,
            city: json.city,
            timezone: json.timezone,
        };

        // Ensure userMeta is initialized
        window.userMeta = window.userMeta || {};
        window.userMeta.geoData = geoData; // Store in userMeta
        window.geoDataFetched = true;      // Update the flag

        saveToLocalStorage();

        return geoData;
    } catch (error) {
        console.error("Geolocation fetch failed:", error);
        return null;
    }
}

/**
 * Refresh geolocation data by resetting the flag and fetching again
 */
export async function refreshGeoLocationData() {
    window.geoDataFetched = false; // Reset the flag
    const geoData = await loadGeoLocationData();
    console.log("Geolocation data refreshed:", geoData);
    window.userMeta.geoData = geoData;
    saveToLocalStorage();
}
