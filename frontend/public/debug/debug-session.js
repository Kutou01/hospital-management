// Debug hospital_auth_session structure
console.log('Debugging hospital_auth_session structure');

// Function to get session data
function getSessionData() {
    try {
        const sessionData = localStorage.getItem('hospital_auth_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            console.log('Session structure:', JSON.stringify(session, null, 2));

            // Check specific keys
            console.log('access_token exists:', !!session.access_token);
            console.log('token exists:', !!session.token);
            console.log('user exists:', !!session.user);

            // Log all top-level keys
            console.log('All keys in session:', Object.keys(session));

            if (session.user) {
                console.log('User structure:', JSON.stringify(session.user, null, 2));
            }
        } else {
            console.log('No session data found');
        }
    } catch (e) {
        console.error('Error parsing session:', e);
    }
}

// Execute when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', getSessionData);
    // Also try immediately
    getSessionData();
}

// Export for console use
if (typeof window !== 'undefined') {
    window.debugSession = getSessionData;
} 