// Test API directly
console.log('Testing API directly');

// Function to test API
async function testAPI() {
    try {
        // Get token from session
        const sessionData = localStorage.getItem('hospital_auth_session');
        let token = null;

        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                // Try different possible token locations
                token = session.access_token ||
                    session.token ||
                    (session.user && session.user.token) ||
                    (session.data && session.data.token);

                console.log('Token found:', !!token);
            } catch (e) {
                console.error('Error parsing session:', e);
            }
        }

        if (!token) {
            console.error('No token found in session');
            return;
        }

        // Test API call
        const response = await fetch('http://localhost:3100/api/medical-records', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('API Response Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('API Response Data:', data);
        } else {
            console.error('API Error:', response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
        }
    } catch (e) {
        console.error('Test API Error:', e);
    }
}

// Execute when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, testing API...');
        testAPI();
    });
}

// Export for console use
if (typeof window !== 'undefined') {
    window.testAPI = testAPI;
} 