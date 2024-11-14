// sessionCookies.js

/**
 * Session Cookies Module
 * Responsible for managing existing cookies, including reading, parsing,
 * and deleting cookies as needed.
 */
const sessionCookies = {
    /**
     * Initialize Cookies-related functionalities.
     * This method can be called during the application's initialization phase if needed.
     */
    init() {
        console.log('[sessionCookies] Initializing Cookies module.');
        // Initialize any necessary cookie-related processes or listeners here
        console.log('[sessionCookies] Cookies module initialization completed.');
    },

    /**
     * Retrieve all cookies as an object.
     * @returns {object} - An object where keys are cookie names and values are cookie values.
     */
    getAllCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(cookieStr => {
            const [name, ...rest] = cookieStr.trim().split('=');
            const value = rest.join('=');
            if (name && value !== undefined) {
                cookies[name] = decodeURIComponent(value);
            }
        });
        console.log('[sessionCookies] Retrieved all cookies:', cookies);
        return cookies;
    },

    /**
     * Retrieve a specific cookie by name.
     * @param {string} name - The name of the cookie to retrieve.
     * @returns {string|null} - The value of the cookie or null if not found.
     */
    getCookie(name) {
        const allCookies = this.getAllCookies();
        const cookieValue = allCookies[name] || null;
        console.log(`[sessionCookies] Retrieved cookie '${name}':`, cookieValue);
        return cookieValue;
    },

    /**
     * Delete a specific cookie by name.
     * @param {string} name - The name of the cookie to delete.
     * @param {string} [path='/'] - The path attribute of the cookie. Defaults to '/'.
     */
    deleteCookie(name, path = '/') {
        if (this.getCookie(name) !== null) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; Secure; SameSite=Strict;`;
            console.log(`[sessionCookies] Deleted cookie '${name}' with path '${path}'.`);
        } else {
            console.warn(`[sessionCookies] Attempted to delete non-existent cookie '${name}'.`);
        }
    },

    /**
     * Check if a specific cookie exists.
     * @param {string} name - The name of the cookie to check.
     * @returns {boolean} - True if the cookie exists, else false.
     */
    hasCookie(name) {
        const exists = this.getCookie(name) !== null;
        console.log(`[sessionCookies] Cookie '${name}' exists:`, exists);
        return exists;
    },

    /**
     * Delete all cookies.
     * **Caution:** Use this method carefully as it removes all cookies accessible via JavaScript.
     */
    deleteAllCookies() {
        const allCookies = this.getAllCookies();
        for (const name in allCookies) {
            this.deleteCookie(name);
        }
        console.log('[sessionCookies] Deleted all cookies.');
    }
};

export default sessionCookies;
