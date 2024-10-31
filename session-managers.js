if (window.fx_customerId) {
    if (!SessionManager.session.userCustomer) {
        console.log("User customer data not found. Initializing user customer...");
        if (typeof fxCustomerInit === 'function') {
            fxCustomerInit(window.fx_customerId);
        } else {
            loadFxCustomerScript();
        }
    }
    if (!SessionManager.session.userContact) {
        console.log("User contact data not found. Initializing user contact...");
        if (typeof zoContactInit === 'function') {
            zoContactInit(window.fx_customerId);
        } else {
            loadZoContactScript();
        }
    }
    if (!SessionManager.session.userDesk || !SessionManager.session.userDesk.ID) {
        console.log("User desk data not found. Initializing user desk...");
        SessionManager.initializeUserDesk(window.fx_customerId);
    }
    if (!SessionManager.session.userZoom) {
        console.log("User zoom data not found. Initializing user zoom...");
        SessionManager.initializeUserZoom();
    }
} else {
    console.warn("No valid customer ID found during polling. Skipping initialization tasks.");
}


SessionManager.getSportUrlCookie = function () {
    const cookieString = document.cookie.split('; ').find(row => row.startsWith('sporturl='));
    if (cookieString) {
        const sporturlValue = decodeURIComponent(cookieString.split('=')[1]);
        const urlParams = new URLSearchParams(sporturlValue);
        window.fx_customerId = urlParams.get('cid');
        window.fx_customer_em = urlParams.get('em');
        const timestamp = urlParams.get('ts');
        window.lastvisit = timestamp ? new Date(parseInt(timestamp)).toLocaleString('en-US', { timeZone: 'America/New_York' }) : null;
        console.log("SportURL cookie parsed:", { fx_customerId: window.fx_customerId, fx_customer_em: window.fx_customer_em, lastvisit: window.lastvisit });
    }
};

SessionManager.updateUserGeo = function () {
    const script = document.createElement('script');
    script.src = "https://get.geojs.io/v1/ip/geo.js";
    script.async = true;
    script.onload = () => {
        if (typeof geoip === 'function') {
            console.log("GeoJS script loaded.");
        }
    };
    document.body.appendChild(script);

    // Define the geoip function
    window.geoip = (json) => {
        const geoData = {
            geoIP: json.ip,
            geoCountry: json.country,
            geoRegion: json.region,
            geoCity: json.city,
            geoTimeZone: json.timezone
        };
        console.log("Geolocation data fetched:", geoData);
        SessionManager.updateSession({ userGeo: geoData }); // Use `SessionManager` here to ensure correct context
    };
};

SessionManager.checkForIdentification = function () {
    const cookies = this.getCookies();
    let identified = false;

    // Check if fx_customer_sso exists
    if (cookies['fx_customer_sso']) {
        const ssoToken = cookies['fx_customer_sso'];
        console.log("SSO token found. Processing fx_customer_sso...");

        const urlParams = new URLSearchParams(ssoToken.split('?')[1]);
        const fcCustomerId = urlParams.get('fc_customer_id');
        const fcAuthToken = urlParams.get('fc_auth_token');

        if (fcCustomerId) {
            document.cookie = `fc_customer_id=${fcCustomerId}; path=/;`;
        }
        if (fcAuthToken) {
            document.cookie = `fc_auth_token=${fcAuthToken}; path=/;`;
        }

        if (!cookies['fx_customer_id'] && fcCustomerId) {
            document.cookie = `fx_customer_id=${fcCustomerId}; path=/;`;
        }
    }

    if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
        identified = true;
        console.log("User identified based on cookies or window properties.");
        this.updateSession({ status: 'user-returning' });
    }

    if (!window.fx_customerId && cookies['fx_customer_id']) {
        window.fx_customerId = cookies['fx_customer_id'];
    }

    console.log("Identification check completed. Identified:", identified);

    if (identified && (cookies['fx_customer_jwt'] || cookies['fx_customer_sso'])) {
        console.log("JWT or SSO token found. Setting up userCart...");
        this.initializeUserCartPlaceholder();
    }

    if (identified && cookies['fx_customerId']) {
        console.log("Attempting to find customer details with fx_customerId.");
        this.findCustomer(cookies['fx_customerId']);
    }

    this.loadIdentificationScripts();
};

// Placeholder function to initialize userCart
SessionManager.initializeUserCartPlaceholder = function () {
    console.log("Placeholder: Initializing userCart...");
};

function updateEmbeddedData(key, data) {
    let userZoom = JSON.parse(localStorage.getItem('userZoom')) || {};

    if (!userZoom._embedded) {
        userZoom._embedded = {};
    }

    userZoom._embedded[key] = data;

    console.log(`Updating _embedded with key: ${key}, data:`, data);
    localStorage.setItem('userZoom', JSON.stringify(userZoom));
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}


// Initialize userZoom 
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");
};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
};

// Initialize userDesk
SessionManager.initializeUserDesk = function(customerId) {
    console.log("Attempting to initialize user desk details...");

    if (!window.fx_customerId) {
        console.error("No valid customer ID found. Initialization aborted.");
        return;
    }

    // Check if UserDesk library is already loaded
    if (typeof UserDesk === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/userdesk.js'; // Update the path as needed

        script.onload = function() {
            console.log("userdesk.js loaded successfully");
            if (typeof UserDesk.initialize === 'function') {
                UserDesk.initialize(customerId);
            } else {
                console.error("UserDesk.initialize function not found in userdesk.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load userdesk.js");
        };

        document.head.appendChild(script);
    } else {
        // UserDesk is already loaded, directly call initialize
        if (typeof UserDesk.initialize === 'function') {
            UserDesk.initialize(customerId);
        } else {
            console.error("UserDesk.initialize function not found");
        }
    }
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");

    if (localStorage.getItem('userCustomer') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js'; 
        script.id = 'fxcustomer';

        script.onload = function() {
            console.log("fxcustomer.js loaded successfully");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit();
            } else {
                console.error("fxCustomerInit function not found in fxcustomer.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load fxcustomer.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userCustomer already exists in local storage.");
    }
};

// Initialize userContact
SessionManager.initializeUserContact = function() {
    console.log("Initializing user contact details...");

    if (localStorage.getItem('userContact') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js';
        script.id = 'zocontact';

        script.onload = function() {
            console.log("zocontact.js loaded successfully");
            if (typeof zoContactInit === 'function') {
                zoContactInit();
            } else {
                console.error("zoContactInit function not found in zocontact.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load zocontact.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userContact already exists in local storage.");
    }
};

// Initialize userThrive
SessionManager.initializeUserThrive = function() {
    console.log("Initializing user thrive details...");
};

// Initialize userAuto
SessionManager.initializeUserAuto = function() {
    console.log("Initializing user auto details...");
};

// Initialize userTrack
SessionManager.initializeUserTrack = function() {
    console.log("Initializing user tracking details...");
};

// Initialize userTrans
SessionManager.initializeUserTrans = function() {
    console.log("Initializing user transaction details...");
};

// Initialize userGetAgain
SessionManager.initializeUserGetAgain = function() {
    console.log("Initializing user 'get again' details...");
    // Placeholder
};