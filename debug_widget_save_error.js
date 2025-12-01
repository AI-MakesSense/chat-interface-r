/**
 * Debug Script: Capture Widget Save Error Details
 * 
 * This script intercepts the widget save request to log the exact
 * validation error details from the server.
 */

// Run this in the browser console when you try to save the widget

// Intercept fetch to log the error details
const originalFetch = window.fetch;
window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    // Check if this is a widget update request
    if (args[0].toString().includes('/api/widgets/') && response.status === 400) {
        const clone = response.clone();
        const errorData = await clone.json();
        console.log('=== VALIDATION ERROR DETAILS ===');
        console.log('Status:', response.status);
        console.log('Error:', errorData.error);
        console.log('Details:', errorData.details);
        console.log('Full response:', errorData);
        console.log('================================');
    }

    return response;
};

console.log('Error interceptor installed. Try saving the widget now.');
