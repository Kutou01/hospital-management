// Check API Gateway configuration
console.log('Checking API Gateway configuration');

// Function to check API Gateway
async function checkAPIConfig() {
    try {
        // Check API Gateway health
        console.log('Checking API Gateway health...');

        try {
            const healthResponse = await fetch('http://localhost:3100/health');
            console.log('Health check status:', healthResponse.status);

            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                console.log('Health check data:', healthData);
            } else {
                console.error('Health check failed:', healthResponse.statusText);
            }
        } catch (e) {
            console.error('Health check error:', e);
        }

        // Check API Gateway without auth
        console.log('Checking API Gateway without auth...');

        try {
            const noAuthResponse = await fetch('http://localhost:3100/api/doctors');
            console.log('No auth check status:', noAuthResponse.status);

            if (noAuthResponse.ok) {
                const noAuthData = await noAuthResponse.json();
                console.log('No auth data:', noAuthData);
            } else {
                console.error('No auth check failed:', noAuthResponse.statusText);
                const errorText = await noAuthResponse.text();
                console.error('Error details:', errorText);
            }
        } catch (e) {
            console.error('No auth check error:', e);
        }

        // Check with fake token
        console.log('Checking with fake token...');

        try {
            const fakeToken = 'fake_token_' + Math.random().toString(36).substring(2, 15);
            const fakeAuthResponse = await fetch('http://localhost:3100/api/medical-records', {
                headers: {
                    'Authorization': `Bearer ${fakeToken}`
                }
            });

            console.log('Fake auth check status:', fakeAuthResponse.status);

            if (fakeAuthResponse.ok) {
                const fakeAuthData = await fakeAuthResponse.json();
                console.log('Fake auth data:', fakeAuthData);
            } else {
                console.error('Fake auth check failed:', fakeAuthResponse.statusText);
                const errorText = await fakeAuthResponse.text();
                console.error('Error details:', errorText);
            }
        } catch (e) {
            console.error('Fake auth check error:', e);
        }

        // Check environment variables
        console.log('Environment variables:');
        console.log('- NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
        console.log('- NEXT_PUBLIC_API_GATEWAY_URL:', process.env.NEXT_PUBLIC_API_GATEWAY_URL);
    } catch (e) {
        console.error('API config check error:', e);
    }
}

// Execute when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, checking API config...');
        checkAPIConfig();
    });
}

// Export for console use
if (typeof window !== 'undefined') {
    window.checkAPIConfig = checkAPIConfig;
} 