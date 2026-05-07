import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('smartlab_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('smartlab_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
