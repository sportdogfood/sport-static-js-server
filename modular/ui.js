// ui.js
import { authenticateCustomer } from './auth.js';
import { refreshGeoLocationData, refreshCustomerZoom } from './geo.js';
import { handleLogout } from './sessionManager.js';

/**
 * Setup UI event listeners
 */
export function setupUIEventListeners() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModalButton = document.getElementById('closeModal');
    const togglePasswordButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    const authButton = document.getElementById('auth-button');

    // Open the modal when login button is clicked
    if (loginButton && modalOverlay) {
        loginButton.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            console.log('Login button clicked. Modal opened.');
        });
        console.log('Login button event listener added.');
    } else {
        console.warn('Login button or modalOverlay not found.');
    }

    // Close the modal when close button is clicked
    if (closeModalButton && modalOverlay) {
        closeModalButton.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            console.log('Close modal button clicked. Modal closed.');
        });
        console.log('Close modal button event listener added.');
    } else {
        console.warn('Close modal button or modalOverlay not found.');
    }

    // Close the modal when clicking outside the modal content
    if (modalOverlay && modalContent) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                console.log('Clicked outside modal content. Modal closed.');
            }
        });
    }

    // Toggle password visibility
    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordButton.textContent = isPassword ? 'Hide' : 'Show';
            console.log(`Password input type changed to ${passwordInput.type}`);
        });
        console.log('Toggle password button event listener added.');
    } else {
        console.warn('Toggle password button or passwordInput not found.');
    }

    // Authentication logic
    if (authButton) {
        authButton.addEventListener('click', authenticateCustomerHandler);
        console.log('Auth button event listener added.');
    } else {
        console.warn('Auth button not found.');
    }

    // Attach event listener to logout button
    if (logoutButton && !logoutButton.listenerAdded) {
        logoutButton.addEventListener('click', handleLogout);
        logoutButton.listenerAdded = true;
        console.log('Logout button event listener added.');
    } else {
        console.warn('Logout button not found or listener already added.');
    }

    // Attach event listener to refresh geolocation data button
    const refreshGeoButton = document.getElementById('refresh-geo-button');
    if (refreshGeoButton) {
        refreshGeoButton.addEventListener('click', refreshGeoLocationData);
        console.log('Refresh Geo button event listener added.');
    } else {
        console.warn('Refresh Geo button not found.');
    }

    // Attach event listener to refresh customerZoom button
    const refreshCustomerZoomButton = document.getElementById('refresh-customerzoom-button');
    if (refreshCustomerZoomButton) {
        refreshCustomerZoomButton.addEventListener('click', refreshCustomerZoom);
        console.log('Refresh CustomerZoom button event listener added.');
    } else {
        console.warn('Refresh CustomerZoom button not found.');
    }
}

/**
 * Handle authentication form submission
 * @param {Event} event - Click event
 */
function authenticateCustomerHandler(event) {
    event.preventDefault();
    const email = document.getElementById('em')?.value;
    const password = document.getElementById('passwordInput')?.value;
    authenticateCustomer(email, password);
}
