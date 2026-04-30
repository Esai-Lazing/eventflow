import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
    headers: {
        'Accept': 'application/json',
    }
});

// Add a request interceptor to include the tokens
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const staffToken = localStorage.getItem('staffToken');
    
    if (token && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (staffToken && staffToken !== 'undefined') {
        config.headers['X-Staff-Token'] = staffToken;
    }
    
    return config;
});

// Add a response interceptor to handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only clear storage and redirect if it's not a login attempt
            const originalRequest = error.config;
            if (originalRequest && !originalRequest.url.includes('login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Do not hard redirect here, let the components handle the state change
                // or use a central auth provider to trigger a redirect/modal.
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (data) => api.post('register', data),
    login: (data) => api.post('login', data),
    logout: () => api.post('logout'),
    updateProfile: (data) => api.put('user/profile', data),
    updatePassword: (data) => api.put('user/password', data),
};

export const eventService = {
    getAll: (params) => api.get('events', { params }),
    create: (data) => api.post('events', data),
    update: (slug, data) => api.put(`events/${slug}`, data),
    get: (slug) => api.get(`events/slug/${slug}`),
    rsvp: (slug, data) => api.post(`rsvp/${slug}`, data),
    refreshStaffToken: (slug) => api.post(`events/${slug}/refresh-staff-token`),
    uploadMusic: (slug, formData) => api.post(`events/${slug}/music`, formData),
    deleteMusic: (slug, songId) => api.delete(`events/${slug}/music/${songId}`),
};

export const guestService = {
    getAll: (slug) => api.get(`events/${slug}/guests`),
    add: (slug, data) => api.post(`events/${slug}/guests`, data),
    update: (id, data) => api.put(`guests/${id}`, data),
    delete: (id) => api.delete(`guests/${id}`),
    get: (token) => api.get(`guests/${token}`),
    checkIn: (token) => api.post(`guests/${token}/check-in`),
    suggestMusic: (token, data) => api.post(`guests/${token}/music`, data),
    postGuestbook: (token, data) => api.post(`guests/${token}/guestbook`, data),
    getNotifications: (token) => api.get(`guests/${token}/notifications`),
};

export const tableService = {
    getAll: (slug) => api.get(`events/${slug}/tables`),
    add: (slug, data) => api.post(`events/${slug}/tables`, data),
    update: (id, data) => api.put(`tables/${id}`, data),
    delete: (id) => api.delete(`tables/${id}`),
};

export const dashboardService = {
    getData: (slug) => api.get('dashboard/data', { params: { slug } }),
};

export default api;
