// Function to push events to PageSense, can be called a maximum of 4 times
function pushPagesense(actionType, customerId) {
    if (pagesenseCallCount >= 4) {
        console.warn('Max number of PageSense calls reached. Skipping action:', actionType);
        return;
    }

    // Prevent recursive calls
    if (window.pushPagesenseLock) {
        console.warn('PushPagesense is currently locked to prevent recursion for action:', actionType);
        return;
    }

    // Ensure that PageSense is loaded
    if (typeof window.pagesense === 'undefined') {
        console.warn('PageSense is not yet loaded. Skipping action:', actionType);
        return;
    }

    window.pushPagesenseLock = true;

    try {
        if (typeof window.pushPagesense === 'function') {
            window.pushPagesense(actionType, customerId);
            console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
            pagesenseCallCount++;
        } else {
            console.error('Pagesense function is not defined on the window object.');
        }
    } catch (error) {
        console.error('Error while pushing Pagesense action:', error);
    } finally {
        window.pushPagesenseLock = false;
    }
}

// Function to load PageSense script dynamically
function loadPageSenseScript() {
    if (!document.getElementById('pagesense-script')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = "https://cdn.pagesense.io/js/sportdogfood141/683c76dd5be1480e9ff129b5be0042a9.js";
        scriptElement.id = 'pagesense-script';
        scriptElement.async = true;
        document.body.appendChild(scriptElement);
        console.log("PageSense script loaded dynamically.");
    }
}