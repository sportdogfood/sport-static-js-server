/* =========== start_3.1_session_init =========== */

const SessionManager = {
    session: null, // Placeholder for session data

    initializeSession() {
        console.log("Initializing session...");
        if (!localStorage.getItem("userSession")) {
            // Start a new session with default data
            this.startSession({
                status: 'logged out', // Default state
                fx_customerId: window.fx_customerId ?? null,
                userMeta: {
                    lastUpdate: getFriendlyDate(),
                    lastScriptRun: getFriendlyDate(),
                    sessionTime: 0 // Initialize sessionTime in seconds
                },
                userCookies: this.getCookies(), // Initialize
                userGeo: {}, // Initialize userGeo
                userPersona: {}, // Initialize
                userCalc: {}, // Initialize
                userContent: {}, // Initialize
                userEvents: [] // Initialize
            });
            console.log("New session started.");
        } else {
            this.getSession();
            console.log("Existing session loaded.", this.session);
        }
    },

    // Retrieve the session
    getSession() {
        this.session = JSON.parse(localStorage.getItem("userSession"));
        console.log("Session retrieved from localStorage.", this.session);
    },

    // Update the session with new data
    updateSession(newData) {
        if (!this.session) {
            this.getSession(); // Retrieve the session if it's not initialized
        }
        Object.assign(this.session, newData);
        if (this.session.userMeta) {
            this.session.userMeta.lastUpdate = getFriendlyDate();
        }
        this.updateLocalStorage();
        console.log("Session updated with new data:", newData);
    },

    // Start a new session
    startSession(userData) {
        this.session = {
            ...userData,
            userMeta: {
                ...userData.userMeta,
                lastUpdate: getFriendlyDate(),
                lastScriptRun: getFriendlyDate(),
                sessionTime: userData.userMeta?.sessionTime ?? 0 // Initialize sessionTime in seconds
            }
        };
        this.updateLocalStorage();
        console.log("Session started:", this.session);
    },

    // End session and clear data
    endSession() {
        this.session = null;
        localStorage.removeItem("userSession");
        console.log("Session ended and removed from localStorage.");
    },

    // Helper to ensure localStorage is up-to-date
    updateLocalStorage() {
        if (this.session) {
            localStorage.setItem("userSession", JSON.stringify(this.session));
            console.log("Session stored in localStorage:", this.session);
        }
    },

    // Retrieve cookies from document
    getCookies() {
        const cookies = document.cookie.split('; ').filter(cookie => cookie);
        const cookieObj = {};
        cookies.forEach(cookie => {
            const [name, ...rest] = cookie.split('=');
            const value = rest.join('=');
            cookieObj[name] = decodeURIComponent(value);
        });
        console.log("Cookies retrieved:", cookieObj);
        return cookieObj;
    }
};

/* =========== end_3.1_session_init =========== */
