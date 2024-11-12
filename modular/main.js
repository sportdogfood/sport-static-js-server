// main.js
import { initializeSession, setupIdleDetection, startSessionAssistPolling } from './sessionManager.js';
import { setupUIEventListeners } from './ui.js';
import { loadExternalScripts } from './scriptLoader.js';

// Encapsulate in an IIFE or let main.js run directly

document.addEventListener('DOMContentLoaded', () => {
    setupIdleDetection(); // Start monitoring user activity for idle detection
    initializeSession(); // Initialize user data and session
    setupUIEventListeners(); // Setup UI event listeners
    loadExternalScripts(); // Load external scripts dynamically when the DOM is ready
    startSessionAssistPolling(); // Start polling for session assist
});
