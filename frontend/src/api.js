import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/backend';
const NEXO_API_BASE_URL = import.meta.env.VITE_NEXO_API_BASE_URL || 'http://localhost:5085';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const nexoApi = axios.create({
    baseURL: NEXO_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add interceptor for handling 401 errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            tokenManager.removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions
export const authAPI = {
    register: async (username, email, password) => {
        const response = await api.post('/register', { username, email, password });
        return response.data;
    },

    login: async (username, password) => {
        const response = await api.post('/login', { username, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/me');
        return response.data;
    },
    getInvitationInfo: async (token) => {
        const response = await api.get(`/api/invitations/${token}`);
        return response.data;
    },
    setPasswordFromInvitation: async (token, password) => {
        const response = await api.post(`/api/invitations/${token}/set-password`, { password });
        return response.data;
    },
};

export const ordersAPI = {
    getOrders: async (limit = 10) => {
        const response = await api.get(`/api/orders?limit=${limit}`);
        return response.data;
    },
    getOrderDetails: async (orderId) => {
        const response = await api.get(`/api/orders/${orderId}/details`);
        return response.data;
    },
    updateOrderStatus: async (orderId, status) => {
        const response = await api.put(`/api/orders/${orderId}/status`, { status });
        return response.data;
    },
};

export const integrationSettingsAPI = {
    getSettings: async () => {
        const response = await api.get('/api/integrations/settings');
        return response.data;
    },
    updateSettings: async (payload) => {
        const response = await api.put('/api/integrations/settings', payload);
        return response.data;
    },
};

export const adminUsersAPI = {
    getUsers: async () => {
        const response = await api.get('/api/admin/users');
        return response.data;
    },
    inviteUser: async (payload) => {
        const response = await api.post('/api/admin/users/invite', payload);
        return response.data;
    },
};

export const nexoAPI = {
    getSession: async () => {
        const response = await nexoApi.get('/api/nexo/session');
        return response.data;
    },
    login: async (operatorLogin, operatorPassword) => {
        const response = await nexoApi.post('/api/nexo/login', {
            operatorLogin,
            operatorPassword,
        });
        return response.data;
    },
    getGoods: async () => {
        const response = await nexoApi.get('/api/nexo/towary');
        return response.data;
    },
};

// Token management
export const tokenManager = {
    setToken: (token) => {
        localStorage.setItem('token', token);
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    removeToken: () => {
        localStorage.removeItem('token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

export default api;
