// sessionMakeCookies.js

/**
 * Session Make Cookies Module
 * Responsible for creating and setting new cookies with specified attributes.
 */
const sessionMakeCookies = {
    /**
     * Initialize Make Cookies-related functionalities.
     * This method can be called during the application's initialization phase if needed.
     */
    init() {
        console.log('[sessionMakeCookies] Initializing Make Cookies module.');
        // Initialize any necessary cookie creation processes or listeners here
        console.log('[sessionMakeCookies] Make Cookies module initialization completed.');
    },

    /**
     * Create and set a new cookie with specified attributes.
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {number} days - Number of days until the cookie expires.
     * @param {string} [path='/'] - The path attribute of the cookie. Defaults to '/'.
     * @param {boolean} [secure=true] - Whether the cookie should be Secure. Defaults to true.
     * @param {string} [sameSite='Strict'] - The SameSite attribute of the cookie. Defaults to 'Strict'.
     */
    setCookie(name, value, days, path = '/', secure = true, sameSite = 'Strict') {
        if (!name) {
            console.error('[sessionMakeCookies] Cookie name is required.');
            return;
        }

        const encodedValue = encodeURIComponent(value);
        let cookieStr = `${name}=${encodedValue}`;

        if (days) {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            cookieStr += `; expires=${expires}`;
        }

        cookieStr += `; path=${path}`;
        
        if (secure) {
            cookieStr += `; Secure`;
        }

        if (sameSite) {
            cookieStr += `; SameSite=${sameSite}`;
        }

        document.cookie = cookieStr;
        console.log(`[sessionMakeCookies] Set cookie: ${cookieStr}`);
    },

    /**
     * Create and set a session cookie (expires when the browser is closed).
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value of the cookie.
     * @param {string} [path='/'] - The path attribute of the cookie. Defaults to '/'.
     * @param {boolean} [secure=true] - Whether the cookie should be Secure. Defaults to true.
     * @param {string} [sameSite='Strict'] - The SameSite attribute of the cookie. Defaults to 'Strict'.
     */
    setSessionCookie(name, value, path = '/', secure = true, sameSite = 'Strict') {
        if (!name) {
            console.error('[sessionMakeCookies] Cookie name is required.');
            return;
        }

        const encodedValue = encodeURIComponent(value);
        let cookieStr = `${name}=${encodedValue}`;

        cookieStr += `; path=${path}`;
        
        if (secure) {
            cookieStr += `; Secure`;
        }

        if (sameSite) {
            cookieStr += `; SameSite=${sameSite}`;
        }

        document.cookie = cookieStr;
        console.log(`[sessionMakeCookies] Set session cookie: ${cookieStr}`);
    },

    /**
     * Create and set a cookie with custom attributes.
     * @param {object} options - Configuration options for the cookie.
     * @param {string} options.name - The name of the cookie.
     * @param {string} options.value - The value of the cookie.
     * @param {number} [options.days] - Number of days until the cookie expires.
     * @param {string} [options.path='/'] - The path attribute of the cookie. Defaults to '/'.
     * @param {boolean} [options.secure=true] - Whether the cookie should be Secure. Defaults to true.
     * @param {string} [options.sameSite='Strict'] - The SameSite attribute of the cookie. Defaults to 'Strict'.
     */
    setCustomCookie(options) {
        const { name, value, days, path = '/', secure = true, sameSite = 'Strict' } = options;
        this.setCookie(name, value, days, path, secure, sameSite);
    },

    /**
     * Create and set multiple cookies at once.
     * @param {Array} cookiesArray - An array of cookie configuration objects.
     * Each object should have the following structure:
     * {
     *   name: 'cookieName',
     *   value: 'cookieValue',
     *   days: 7, // Optional
     *   path: '/', // Optional
     *   secure: true, // Optional
     *   sameSite: 'Strict' // Optional
     * }
     */
    setMultipleCookies(cookiesArray) {
        if (!Array.isArray(cookiesArray)) {
            console.error('[sessionMakeCookies] setMultipleCookies expects an array of cookie configurations.');
            return;
        }

        cookiesArray.forEach(cookieConfig => {
            this.setCookie(
                cookieConfig.name,
                cookieConfig.value,
                cookieConfig.days,
                cookieConfig.path,
                cookieConfig.secure,
                cookieConfig.sameSite
            );
        });

        console.log('[sessionMakeCookies] Set multiple cookies:', cookiesArray.map(c => c.name));
    }
};

export default sessionMakeCookies;
