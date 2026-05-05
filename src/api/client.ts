import axios from 'axios';

// Production: Render backend
// Change this if you want to test locally: 'http://192.168.X.X:4000'
export const API_ROOT = 'https://twond-campus-compliant-system.onrender.com';
export const API_URL = `${API_ROOT}/api`;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s — accounts for Render cold start wake-up
  headers: {
    'Content-Type': 'application/json',
  },
});
