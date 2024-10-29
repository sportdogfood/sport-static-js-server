/* =========== start_3.2_user_data_enrichment =========== */

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

/* =========== end_3.2_user_data_enrichment =========== */