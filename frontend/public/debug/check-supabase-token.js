// Check Supabase token structure
console.log('Checking Supabase token structure');

// Function to check token
function checkSupabaseToken() {
    try {
        // Check for Supabase token
        const supabaseToken = localStorage.getItem('sb-ciasxktujslgsdgylimv-auth-token');
        if (supabaseToken) {
            try {
                const parsed = JSON.parse(supabaseToken);
                console.log('Supabase token found:', parsed);

                // Check structure
                if (parsed.access_token) {
                    console.log('Access token:', parsed.access_token.substring(0, 20) + '...');
                }

                if (parsed.refresh_token) {
                    console.log('Refresh token exists');
                }

                if (parsed.user) {
                    console.log('User info:', parsed.user);
                }

                // Print all keys
                console.log('All keys in Supabase token:', Object.keys(parsed));

                return parsed;
            } catch (e) {
                console.error('Error parsing Supabase token:', e);
            }
        } else {
            console.log('No Supabase token found');
        }

        return null;
    } catch (e) {
        console.error('Error checking Supabase token:', e);
        return null;
    }
}

// Execute when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkSupabaseToken);
}

// Export for console use
if (typeof window !== 'undefined') {
    window.checkSupabaseToken = checkSupabaseToken;
} 