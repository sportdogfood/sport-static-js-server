/* =========== start_7_sessionUIstate =========== */

// Define the buttonMaster function
function defineButtonMaster() {
    window.buttonMaster = function (status, caller) {
        console.log(`[buttonMaster] Called with status: ${status}, by: ${caller}`);

        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const statusDiv = document.getElementById('status-div');
        const authButton = document.getElementById('auth-button');

        // Ensure all buttons are found
        console.log(`[buttonMaster] loginButton found: ${!!loginButton}, logoutButton found: ${!!logoutButton}, statusDiv found: ${!!statusDiv}, authButton found: ${!!authButton}`);

        const friendlyDate = getFriendlyDate();
        if (statusDiv) {
            statusDiv.textContent = `${status} at ${friendlyDate} by ${caller}`;
            statusDiv.style.display = 'block';
            console.log(`[buttonMaster] Updated statusDiv: ${statusDiv.textContent}`);
        } else {
            console.error('[buttonMaster] statusDiv is not found in the DOM.');
        }

        if (status === 'logged in') {
            loginButton && (loginButton.style.display = 'none');
            logoutButton && (logoutButton.style.display = 'inline');
        } else if (status === 'logged out') {
            loginButton && (loginButton.style.display = 'inline');
            logoutButton && (logoutButton.style.display = 'none');
        } else {
            console.error(`[buttonMaster] Invalid status: ${status} passed to buttonMaster`);
        }
    };
}

defineButtonMaster();

/* =========== end_7_sessionUIstate =========== */