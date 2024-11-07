
/* session-assist.js */
/* Last Updated: November 1, 2024, 4:00 PM EDT */
(async function () {
    // Declare global variables
    window.userMeta = {};
    window.userState = {};
    window.userSession = {
        sessionState: {
            timeStarted: getLastUpdated(),
            secondsSpent: 0
        }
    };
    window.userAuth = "";

    // Function to get current date and time in US/EDT
    function getLastUpdated() {
        return new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
        });
    }

    // Function to parse URL parameters
    function parseUrlParams(url) {
        const params = {};
        const parser = document.createElement('a');
        parser.href = url;
        const query = parser.search.substring(1);
        const vars = query.split('&');
        vars.forEach(function (v) {
            const pair = v.split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        });
        return params;
    }

    // Function to set a cookie
    function setCookie(name, value, days) {
        const expires = days
            ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString()
            : '';
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
        console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
    }

    // Overhauled Function to update userState
    function updateUserState(allData) {
        console.log("Updating userState");

        window.userState = {
            ...window.userState,
            lastUpdated: getLastUpdated(),
        };

        // Overhaul: Evaluate user based on multiple criteria
        if (allData['fcsid'] && allData['fx_customer_sso']) {
            window.userState.state = 'authenticated-and-active';
            window.userState.subState = 'user-identified-by-session-and-sso';
            window.userAuth = 'authenticated';
            console.log("User meets criteria for authenticated and active state. Initializing user contact...");
            SessionManager.initializeUserContact();
        } else if (allData['fcsid']) {
            window.userState.state = 'session-active';
            window.userState.subState = 'identified-by-session';
            window.userAuth = 'authenticated';
        } else if (allData['fx_customer_sso'] || allData['fx_customer_jwt']) {
            window.userState.state = 'authenticated';
            window.userState.subState = 'user-logged-in';
            window.userAuth = 'authenticated';
        } else if (localStorage.getItem('fx_customerId')) {
            window.userState.state = 'known-customer';
            window.userState.subState = 'identified-by-localstorage';
            window.userAuth = 'authenticated';
        } else if (window.location.href.includes('promo') && allData['sporturl']) {
            window.userState.state = 'promotional-visitor';
            window.userState.subState = 'promo-link-detected';
            window.userAuth = '';
        } else if (allData['geoData.region']) {
            window.userState.state = 'region-visitor';
            window.userState.subState = `visitor-from-${allData['geoData.region']}`;
            window.userAuth = '';
        } else if (window.userSession.sessionState.secondsSpent > 300) {
            window.userState.state = 'idle';
            window.userState.subState = 'user-idle';
            window.userAuth = '';
        } else {
            window.userState.state = 'visitor';
            window.userState.subState = 'general-visitor';
            window.userAuth = '';
        }

        const event = new CustomEvent('userStateChanged', { detail: window.userState });
        window.dispatchEvent(event);

        console.log('User State Updated:', window.userState);

        updateButtonState();
    }

    // Helper function to update button state based on userState
    function updateButtonState() {
        const loginButton = document.getElementById('login-id');
        const logoutButton = document.getElementById('logout-id');

        if (window.userAuth === 'authenticated') {
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'block';
        } else {
            if (loginButton) loginButton.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    }

    function fireSessionStart() {
        console.log('Session Started');
    }

    function updateSessionState(userMeta) {
        console.log('Session State Updated with userMeta:', userMeta);
    }

    // Delay to allow cookies to load completely
    setTimeout(() => {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = decodeURIComponent(value);
            return acc;
        }, {});

        console.log("All cookies: ", cookies);

        window.fx_customerId = cookies['fx_customerId'] || null;
        window.fx_customer_id = cookies['fx_customer_id'] || null;
        window.fx_customer_em = cookies['fx_customer_em'] || null;
        window.fx_customerEmail = cookies['fx_customerEmail'] || null;
        window.fx_customerEm = cookies['fx_customerEm'] || null;
        window.fx_customerPin = cookies['fx_customerPin'] || null;
        window.fx_customerLastVisit = cookies['fx_customerLastVisit'] || null;

        window.userMeta = {
            ...window.userMeta,
            lastUpdated: getLastUpdated(),
            friendlyLastUpdated: getLastUpdated(),
        };

        window.userState = {
            ...window.userState,
            lastUpdated: getLastUpdated(),
        };

        window.userSession = {
            ...window.userSession,
            lastUpdated: getLastUpdated(),
            sessionId: cookies['fcsid'] || 'annon',
            sessionState: {
                ...window.userSession.sessionState,
                timeStarted: window.userSession.sessionState.timeStarted || getLastUpdated(),
                secondsSpent: window.userSession.sessionState.secondsSpent || 0
            }
        };

        window.userMeta = {
            ...window.userMeta,
            fx_customerId: window.fx_customerId,
            fx_customer_id: window.fx_customer_id,
            fx_customer_em: window.fx_customer_em,
            fx_customerEmail: window.fx_customerEmail,
            fx_customerEm: window.fx_customerEm,
            fx_customerPin: window.fx_customerPin,
            fx_customerLastVisit: window.fx_customerLastVisit,
        };

        console.log("Final userMeta before updating state:", window.userMeta);
        
        updateUserState({
            ...cookies,
            'geoData.region': window.userMeta.geoData?.region,
        });

        // Delay to allow calculations before firing session start
        setTimeout(() => {
            fireSessionStart();
            updateSessionState(window.userMeta);
        }, 500);
    }, 1000); // Delay added to ensure cookies are fully loaded

    // Placeholder function for performSessionAssist
function performSessionAssist() {
    console.log('Performing session assist operations...');
    // Placeholder logic to be implemented
}

// Placeholder function for parse_sporturl
function parse_sporturl(sporturl) {
    console.log('Parsing sporturl:', sporturl);
    // Placeholder logic for parsing sporturl
}

// Call performSessionAssist every 45 seconds
    setInterval(() => {
        performSessionAssist();
    }, 45000);
})();

