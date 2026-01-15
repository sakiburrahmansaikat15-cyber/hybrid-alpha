import axios from 'axios';

window.axios = axios;

// Configure Axios defaults for Sanctum
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

// Set default baseURL if needed (optional, depends on environment)
// window.axios.defaults.baseURL = 'http://localhost:8000';

// CSRF Token synchronization from meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// Global Interceptor for handling CSRF expiration (419) and Session expiration (401)
window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 419 Page Expired (CSRF Token Mismatch/Expired)
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Re-initialize CSRF cookie
                await axios.get('/sanctum/csrf-cookie');
                // The cookies are handled automatically by the browser because withCredentials is true
                return window.axios(originalRequest);
            } catch (recsrfError) {
                return Promise.reject(recsrfError);
            }
        }

        // Handle 401 Unauthorized (Session Expired)
        if (error.response?.status === 401) {
            // Redirect to login or handle session cleanup
            // We avoid infinite loops by checking the URL
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }
        }

        return Promise.reject(error);
    }
);
