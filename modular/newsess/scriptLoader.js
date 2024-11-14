// scriptLoader.js

/**
 * Utility function to load an external script dynamically
 * @param {string} src - Source URL of the script
 * @param {string} id - Unique ID to assign to the script element
 * @returns {Promise} - Resolves when the script is loaded successfully, rejects on error
 */
export function loadExternalScript(src, id) {
    return new Promise((resolve, reject) => {
        // Check if the script is already loaded
        if (document.getElementById(id) || window[`${id}Loaded`]) {
            console.log(`${id} script is already loaded or loading.`);
            resolve();
            return;
        }

        const scriptElement = document.createElement('script');
        scriptElement.src = src;
        scriptElement.id = id;
        scriptElement.async = true;

        scriptElement.onload = () => {
            console.log(`${id} script loaded successfully.`);
            window[`${id}Loaded`] = true;
            resolve();
        };

        scriptElement.onerror = () => {
            console.error(`Failed to load ${id} script.`);
            reject(new Error(`Failed to load script: ${src}`));
        };

        document.body.appendChild(scriptElement);
        console.log(`Attempting to load ${id} script dynamically.`);
    });
}
