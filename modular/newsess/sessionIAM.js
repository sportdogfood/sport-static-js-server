// sessionIAM.js

import { getFriendlyDateTime } from './sessionUtils.js';

/**
 * Session IAM Module
 * Responsible for managing Identity and Access Management functionalities,
 * including user roles, permissions, and access level validations.
 */
const sessionIAM = {
    /**
     * Initialize IAM-related functionalities.
     * This can include loading user roles from a source, setting default permissions, etc.
     */
    init() {
        console.log('[sessionIAM] Initializing IAM module.');
        this.loadUserRoles();
        this.setupRoleListeners();
        console.log('[sessionIAM] IAM module initialization completed.');
    },

    /**
     * Load user roles from localStorage or initialize with default roles.
     */
    loadUserRoles() {
        console.log('[sessionIAM] Loading user roles.');
        const storedRoles = localStorage.getItem('userRoles');
        window.userRoles = storedRoles ? JSON.parse(storedRoles) : this.getDefaultRoles();
        console.log('[sessionIAM] Loaded user roles:', window.userRoles);
    },

    /**
     * Save current user roles to localStorage.
     */
    saveUserRoles() {
        localStorage.setItem('userRoles', JSON.stringify(window.userRoles));
        console.log('[sessionIAM] User roles saved to localStorage.');
    },

    /**
     * Define default roles and permissions.
     * Modify this method to suit your application's role structure.
     * @returns {object} - Default roles with associated permissions.
     */
    getDefaultRoles() {
        return {
            guest: {
                permissions: ['read'],
                description: 'Guest users with limited access.'
            },
            user: {
                permissions: ['read', 'write'],
                description: 'Registered users with standard access.'
            },
            admin: {
                permissions: ['read', 'write', 'delete'],
                description: 'Administrators with full access.'
            }
            // Add more roles as needed
        };
    },

    /**
     * Assign a role to a user.
     * @param {string} role - The role to assign (e.g., 'user', 'admin').
     */
    assignRole(role) {
        if (window.userRoles[role]) {
            window.userRoles.currentRole = role;
            this.saveUserRoles();
            console.log(`[sessionIAM] Assigned role '${role}' to the user.`);
            this.dispatchRoleChangeEvent(role);
        } else {
            console.warn(`[sessionIAM] Role '${role}' does not exist.`);
        }
    },

    /**
     * Remove the current role from the user.
     */
    removeRole() {
        const previousRole = window.userRoles.currentRole;
        delete window.userRoles.currentRole;
        this.saveUserRoles();
        console.log(`[sessionIAM] Removed role '${previousRole}' from the user.`);
        this.dispatchRoleChangeEvent(null);
    },

    /**
     * Check if the current user has a specific permission.
     * @param {string} permission - The permission to check (e.g., 'read', 'write').
     * @returns {boolean} - True if the user has the permission, else false.
     */
    hasPermission(permission) {
        const currentRole = window.userRoles.currentRole;
        if (!currentRole) {
            console.warn('[sessionIAM] No role assigned to the user.');
            return false;
        }

        const permissions = window.userRoles[currentRole].permissions;
        const hasPerm = permissions.includes(permission);
        console.log(`[sessionIAM] User has permission '${permission}':`, hasPerm);
        return hasPerm;
    },

    /**
     * Get the description of the current user's role.
     * @returns {string} - Description of the current role or a default message.
     */
    getCurrentRoleDescription() {
        const currentRole = window.userRoles.currentRole;
        if (currentRole && window.userRoles[currentRole]) {
            return window.userRoles[currentRole].description;
        }
        return 'No role assigned.';
    },

    /**
     * Setup event listeners for role changes.
     * This allows other parts of the application to respond to role updates.
     */
    setupRoleListeners() {
        window.addEventListener('roleChanged', (event) => {
            console.log('[sessionIAM] Role changed event received:', event.detail);
            // Implement any additional logic needed when a role changes
            // For example, updating UI elements based on the new role
        });
    },

    /**
     * Dispatch a custom event when the user's role changes.
     * @param {string|null} newRole - The new role assigned to the user.
     */
    dispatchRoleChangeEvent(newRole) {
        const event = new CustomEvent('roleChanged', { detail: { newRole, timestamp: getFriendlyDateTime() } });
        window.dispatchEvent(event);
        console.log('[sessionIAM] roleChanged event dispatched:', { newRole, timestamp: getFriendlyDateTime() });
    }
};

export default sessionIAM;
