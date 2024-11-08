// Initialize pagesenseCallCount globally
let pagesenseCallCount = 0;

// Track which events have already triggered PageSense push
const pagesenseEventTracker = {
    'user-auth': false,
    'user-logged-in': false,
    'user-logged-out': false,
    'user-land-home': false,
    'user-land-thispage': false,
    'user-fxId': false
};

// Function to push events to PageSense, can be called a maximum of 4 times
function pushPagesense(actionType, customerId = "") {
    if (pagesenseCallCount >= 4) {
        console.warn('Max number of PageSense calls reached. Skipping action:', actionType);
        return;
    }

    // Check if this event type has already been pushed
    if (pagesenseEventTracker[actionType]) {
        console.log(`Pagesense event for actionType: ${actionType} has already been triggered. Skipping.`);
        return;
    }

    // Mark the event as triggered
    pagesenseEventTracker[actionType] = true;

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
