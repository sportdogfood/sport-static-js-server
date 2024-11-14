// sessionGeo.js

import { getFriendlyDateTime } from './sessionUtils.js';
import sessionEnrich from './sessionEnrich.js'; // Import if enrichment is needed
import sessionTimer from './sessionTimer.js';   // Import if timing adjustments are needed

/**
 * Session Geolocation Module
 * Responsible for obtaining and managing geolocation data within the session.
 * This includes requesting user permission, fetching location data, handling errors,
 * and enriching session data with geographical information.
 */
const sessionGeo = {
    /**
     * Initialize Geolocation-related functionalities.
     * This method should be called during the application's initialization phase.
     */
    init() {
        console.log('[sessionGeo] Initializing Geolocation module.');
        this.requestGeolocationPermission();
        this.setupRefreshListener();
        console.log('[sessionGeo] Geolocation module initialization completed.');
    },

    /**
     * Request permission from the user to access their geolocation.
     * If granted, fetch and store the geolocation data.
     */
    requestGeolocationPermission() {
        if (!navigator.geolocation) {
            console.error('[sessionGeo] Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('[sessionGeo] Geolocation permission granted.');
                this.handleGeolocationSuccess(position);
            },
            (error) => {
                console.error('[sessionGeo] Geolocation permission denied or unavailable:', error);
                this.handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds
                maximumAge: 0
            }
        );
    },

    /**
     * Handle successful retrieval of geolocation data.
     * @param {GeolocationPosition} position - The position object returned by the Geolocation API.
     */
    handleGeolocationSuccess(position) {
        const { latitude, longitude } = position.coords;
        const timestamp = getFriendlyDateTime();

        // Update global userMeta with geolocation data
        window.userMeta = {
            ...window.userMeta,
            geoData: {
                latitude,
                longitude,
                timestamp,
                city: null,     // To be fetched via reverse geocoding if needed
                country: null   // To be fetched via reverse geocoding if needed
            }
        };

        console.log('[sessionGeo] Geolocation data updated:', window.userMeta.geoData);

        // Optionally, perform reverse geocoding to get city and country
        this.fetchLocationDetails(latitude, longitude);

        // Enrich session data
        sessionEnrich.enrichSessionData({
            geoData: window.userMeta.geoData
        });

        // Reset session timer to account for user activity
        sessionTimer.resetTimer();

        // Save updated session data to localStorage
        this.saveGeolocationData();
    },

    /**
     * Handle errors encountered while retrieving geolocation data.
     * @param {GeolocationPositionError} error - The error object returned by the Geolocation API.
     */
    handleGeolocationError(error) {
        // Update global userMeta with geolocation error
        window.userMeta = {
            ...window.userMeta,
            geoDataError: {
                code: error.code,
                message: error.message,
                timestamp: getFriendlyDateTime()
            }
        };

        console.warn('[sessionGeo] Geolocation error recorded:', window.userMeta.geoDataError);

        // Enrich session data with error information
        sessionEnrich.enrichSessionData({
            geoDataError: window.userMeta.geoDataError
        });

        // Reset session timer to account for user activity
        sessionTimer.resetTimer();

        // Save updated session data to localStorage
        this.saveGeolocationData();
    },

    /**
     * Fetch additional location details (e.g., city, country) using reverse geocoding.
     * This method uses a third-party API to convert latitude and longitude into human-readable location details.
     * @param {number} latitude - The latitude coordinate.
     * @param {number} longitude - The longitude coordinate.
     */
    async fetchLocationDetails(latitude, longitude) {
        try {
            // Example using OpenCage Geocoding API (You need to replace 'YOUR_API_KEY' with a valid API key)
            const apiKey = 'YOUR_API_KEY';
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`);
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding failed with status ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const { city, country } = data.results[0].components;

                // Update userMeta with city and country
                window.userMeta.geoData.city = city || 'Unknown';
                window.userMeta.geoData.country = country || 'Unknown';

                console.log('[sessionGeo] Reverse geocoding successful:', {
                    city: window.userMeta.geoData.city,
                    country: window.userMeta.geoData.country
                });

                // Enrich session data with location details
                sessionEnrich.enrichSessionData({
                    geoData: window.userMeta.geoData
                });

                // Save updated session data to localStorage
                this.saveGeolocationData();
            } else {
                console.warn('[sessionGeo] No results from reverse geocoding API.');
            }
        } catch (error) {
            console.error('[sessionGeo] Error during reverse geocoding:', error);
            // Optionally, update session data with reverse geocoding error
            window.userMeta = {
                ...window.userMeta,
                geoDataReverseError: {
                    message: error.message,
                    timestamp: getFriendlyDateTime()
                }
            };
            sessionEnrich.enrichSessionData({
                geoDataReverseError: window.userMeta.geoDataReverseError
            });
            this.saveGeolocationData();
        }
    },

    /**
     * Setup an event listener to allow users to manually refresh their geolocation data.
     * This can be tied to a button click or other user-initiated actions.
     */
    setupRefreshListener() {
        const refreshButton = document.getElementById('refreshGeoButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                console.log('[sessionGeo] Refresh geolocation requested by user.');
                this.requestGeolocationPermission();
            });
            console.log('[sessionGeo] Geolocation refresh listener set up.');
        } else {
            console.warn('[sessionGeo] Refresh geolocation button (#refreshGeoButton) not found in the DOM.');
        }
    },

    /**
     * Save geolocation data to localStorage to maintain session continuity.
     */
    saveGeolocationData() {
        if (window.userMeta) {
            localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
            console.log('[sessionGeo] Geolocation data saved to localStorage:', window.userMeta.geoData || window.userMeta.geoDataError);
        } else {
            console.warn('[sessionGeo] No userMeta found to save geolocation data.');
        }
    }
};

export default sessionGeo;
