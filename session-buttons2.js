// buttons.js
// Last Updated: November 6, 2024

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed, initializing buttons.');

    // Wait for userState to be initialized
    const userState = window.userState || {};
    
    // Ensure buttons are updated when the DOM is ready
    // However, defer this until the modal is confirmed to be loaded
    if (typeof window.loginModalLoaded === 'undefined' || !window.loginModalLoaded) {
        // Listen for 'loginModalLoaded' event dispatched after login modal is successfully appended to the DOM
        document.addEventListener('loginModalLoaded', () => {
            console.log('Login modal loaded event detected, updating buttons.');
            updateUniversalButtons(userState);
        });
    } else {
        // Update buttons immediately if the modal is already loaded
        updateUniversalButtons(userState);
    }

    // Listen for userStateChanged event
    window.addEventListener('userStateChanged', (e) => {
        const userState = e.detail;
        console.log('userStateChanged event received:', userState);
        updateUniversalButtons(userState);
    });
});

function updateUniversalButtons(userState) {
    console.log('Updating buttons based on user state:', userState);

    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');
    const statusDiv = document.getElementById('status-div');
    const authBtn = document.getElementById('auth-button'); // Button inside login modal

    if (!loginBtn || !logoutBtn) {
        console.error('Login or Logout button not found in the DOM. Aborting button update.');
        return;
    }

    // Add event listener to login button to open the modal if available
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'block'; // Show the login modal
            } else {
                console.error('Login modal not found in the DOM.');
            }
        });
    }

    // Determine the state and update buttons accordingly
    switch (userState.state) {
        case 'customer':
            // User is logged in
            console.log('User is logged in. Showing logout button and hiding login button.');
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.textContent = 'Welcome back!';
            }

            // Grey out the authBtn inside the login modal
            if (authBtn) {
                authBtn.disabled = true;
                authBtn.classList.add('button-disabled'); // Add a CSS class for styling
            }

            // Attach event listener to logout button
            logoutBtn.addEventListener('click', () => {
                // Trigger the logout function and update userState
                console.log('Logout button clicked, logging out the user.');
                handleLogout(); // Assuming there's a logout function that manages session clearing
            });
            break;

        case 'contact':
            // User is known but not logged in
            console.log('User is known but not logged in. Showing login button.');
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.textContent = 'Please log in.';
            }

            if (authBtn) {
                authBtn.disabled = false;
                authBtn.classList.remove('button-disabled');
            }
            break;

        case 'potential':
            // Potential user
            console.log('User is a potential customer. Showing login button.');
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.textContent = 'Welcome! Please log in or sign up.';
            }

            if (authBtn) {
                authBtn.disabled = false;
                authBtn.classList.remove('button-disabled');
            }
            break;

        case 'visitor':
        default:
            // Visitor or unknown state
            console.log('User is a visitor or unhandled state. Showing login button.');
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.textContent = 'Welcome visitor! Please log in or sign up.';
            }

            if (authBtn) {
                authBtn.disabled = false;
                authBtn.classList.remove('button-disabled');
            }
            break;
    }
}

// Function to handle logout process
function handleLogout() {
    // Assuming that `session-auth.js` has a function to clear cookies and user session data
    // Clear session data and update userState here
    console.log('Handling logout. Updating session and user state.');
    if (typeof window.sessionAssist === 'function') {
        window.sessionAssist(); // Update session information
    }

    window.userState = {
        state: 'visitor',
        subState: 'logged-out',
        lastUpdated: new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
        })
    };

    // Dispatch the userStateChanged event to notify components of state change
    const event = new CustomEvent('userStateChanged', { detail: window.userState });
    window.dispatchEvent(event);
}
