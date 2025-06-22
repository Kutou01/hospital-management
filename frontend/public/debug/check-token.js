// Check token structure
console.log('Checking token structure');

// Function to check token
function checkToken() {
    try {
        // Check all localStorage items
        console.log('All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`- ${key}`);
        }

        // Check hospital_auth_session
        const sessionData = localStorage.getItem('hospital_auth_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                console.log('Session found:', Object.keys(session));

                // Check for token in different locations
                const possibleTokens = [
                    { name: 'access_token', value: session.access_token },
                    { name: 'token', value: session.token },
                    { name: 'user.token', value: session.user?.token },
                    { name: 'data.token', value: session.data?.token }
                ];

                console.log('Possible tokens:');
                possibleTokens.forEach(item => {
                    console.log(`- ${item.name}: ${item.value ? 'exists' : 'not found'}`);
                });

                // Check for other auth-related items
                console.log('Checking for userToken:', localStorage.getItem('userToken'));
                console.log('Checking for refreshToken:', localStorage.getItem('refreshToken'));

                // Print full session for inspection
                console.log('Full session:', JSON.stringify(session, null, 2));
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        } else {
            console.log('No hospital_auth_session found');
        }

        // Check for Supabase session
        const supabaseSession = localStorage.getItem('supabase.auth.token');
        if (supabaseSession) {
            try {
                const parsed = JSON.parse(supabaseSession);
                console.log('Supabase session found:', Object.keys(parsed));
            } catch (e) {
                console.error('Error parsing Supabase session:', e);
            }
        }
    } catch (e) {
        console.error('Error checking token:', e);
    }
}

// Execute when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkToken);
}

// Export for console use
if (typeof window !== 'undefined') {
    window.checkToken = checkToken;
} 