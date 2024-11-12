// scriptLoader.js

/**
 * Load External evaluateCustomerState Script
 */
export function loadEvaluateCustomerStateScript() {
    if (!document.getElementById('evaluatecustomerstate-script') && !window.evaluateCustomerStateLoading) {
        window.evaluateCustomerStateLoading = true; // Flag to prevent multiple loading attempts

        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/evaluatecustomerstate.js";
        scriptElement.id = 'evaluatecustomerstate-script';
        scriptElement.async = true;

        scriptElement.onload = function () {
            console.log("EvaluateCustomerState script loaded successfully.");
            window.evaluateCustomerStateLoaded = true; // Flag to indicate the script has been loaded
            window.evaluateCustomerStateLoading = false;
        };

        scriptElement.onerror = function () {
            console.error("Failed to load EvaluateCustomerState script.");
            window.evaluateCustomerStateLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log("Attempting to load EvaluateCustomerState script dynamically.");
    } else {
        console.log("EvaluateCustomerState script is already loading or has been loaded.");
    }
}

/**
 * Load external PageSense script
 */
export function loadPageSenseScript() {
    // Check if the script is already loaded or if there is an ongoing attempt to load it
    if (!document.getElementById('pagesense-script') && !window.pagesenseScriptLoading) {
        window.pagesenseScriptLoading = true; // Flag to prevent multiple loading attempts

        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/session-pagesense.js";
        scriptElement.id = 'pagesense-script';
        scriptElement.async = true;

        scriptElement.onload = function () {
            console.log("PageSense script loaded successfully from session-pagesense.js.");
            window.pagesenseScriptLoaded = true; // Flag to indicate the script has been loaded
            window.pagesenseScriptLoading = false;
        };

        scriptElement.onerror = function () {
            console.error("Failed to load PageSense script from session-pagesense.js.");
            window.pagesenseScriptLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log("Attempting to load PageSense script dynamically from session-pagesense.js.");
    } else {
        console.log("PageSense script is already loading or has been loaded.");
    }
}

/**
 * Load additional scripts for authenticated users
 */
export function loadAuthenticatedUserScripts() {
    if (window.userAuth !== 'authenticated') {
        console.log('User is not authenticated. Aborting script loading.');
        return;
    }

    // Load fxcustomerzoom.js first
    const customerZoomScriptInfo = {
        src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js',
        id: 'fxcustomerzoom',
        initFunction: 'customerzoomInit'
    };

    function loadScript(scriptInfo, onSuccess, onFailure) {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Executing ${scriptInfo.initFunction} function.`);
                    try {
                        window[scriptInfo.initFunction]();
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        console.error(`${scriptInfo.initFunction} function failed:`, error);
                        if (onFailure) onFailure();
                    }
                } else {
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
                    if (onFailure) onFailure();
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load ${scriptInfo.id}.js`);
                if (onFailure) onFailure();
            };

            document.body.appendChild(scriptElement);
        } else {
            console.log(`${scriptInfo.id}.js is already loaded`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                try {
                    window[scriptInfo.initFunction]();
                    if (onSuccess) onSuccess();
                } catch (error) {
                    console.error(`${scriptInfo.initFunction} function failed:`, error);
                    if (onFailure) onFailure();
                }
            } else {
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded.`);
                if (onFailure) onFailure();
            }
        }
    }

    // Load the other scripts after customerzoomInit has successfully executed
    function loadOtherScripts() {
        const otherScriptsToLoad = [
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
        ];

        otherScriptsToLoad.forEach(scriptInfo => {
            loadScript(scriptInfo);
        });
    }

    // Load customerzoom.js and then load other scripts upon successful initialization
    loadScript(customerZoomScriptInfo, loadOtherScripts, function () {
        console.error('customerzoomInit failed or script did not load, not loading other scripts.');
    });
}

/**
 * Load external scripts
 */
export function loadExternalScripts() {
    loadPageSenseScript();
    loadEvaluateCustomerStateScript();
    // Any other external scripts can be loaded here
}
