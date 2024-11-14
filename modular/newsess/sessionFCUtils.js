// sessionFCUtils.js

/**
 * Load additional scripts required for authenticated users
 */
export function loadAuthenticatedUserScripts() {
    const authenticatedScripts = [
        {
            src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js',
            id: 'fxcustomerzoom',
            initFunction: 'customerzoomInit'
        },
        {
            src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js',
            id: 'fxsubscriptions',
            initFunction: 'subscriptionsInit'
        },
        {
            src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js',
            id: 'fxtransactions',
            initFunction: 'transactionsInit'
        },
        {
            src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js',
            id: 'fxattributes',
            initFunction: 'attributesInit'
        }
    ];

    authenticatedScripts.forEach(scriptInfo => {
        loadScript(scriptInfo);
    });
}

/**
 * Dynamically load a script and execute its initialization function
 * @param {object} scriptInfo - Information about the script to load
 */
function loadScript(scriptInfo) {
    if (!document.getElementById(scriptInfo.id)) {
        const scriptElement = document.createElement('script');
        scriptElement.src = scriptInfo.src;
        scriptElement.id = scriptInfo.id;
        scriptElement.async = true;

        scriptElement.onload = () => {
            console.log(`[sessionFCUtils] ${scriptInfo.id}.js loaded successfully.`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                try {
                    window[scriptInfo.initFunction]();
                    console.log(`[sessionFCUtils] ${scriptInfo.initFunction} executed successfully.`);
                } catch (error) {
                    console.error(`[sessionFCUtils] Error executing ${scriptInfo.initFunction}:`, error);
                }
            } else {
                console.error(`[sessionFCUtils] ${scriptInfo.initFunction} is not a function or not defined in ${scriptInfo.id}.js.`);
            }
        };

        scriptElement.onerror = () => {
            console.error(`[sessionFCUtils] Failed to load script: ${scriptInfo.src}`);
        };

        document.body.appendChild(scriptElement);
        console.log(`[sessionFCUtils] Attempting to load script: ${scriptInfo.src}`);
    } else {
        console.log(`[sessionFCUtils] ${scriptInfo.id}.js is already loaded.`);
        // Optionally, re-execute the initialization function if necessary
        if (typeof window[scriptInfo.initFunction] === 'function') {
            try {
                window[scriptInfo.initFunction]();
                console.log(`[sessionFCUtils] ${scriptInfo.initFunction} re-executed successfully.`);
            } catch (error) {
                console.error(`[sessionFCUtils] Error re-executing ${scriptInfo.initFunction}:`, error);
            }
        } else {
            console.warn(`[sessionFCUtils] ${scriptInfo.initFunction} is not defined in the already loaded ${scriptInfo.id}.js.`);
        }
    }
}
