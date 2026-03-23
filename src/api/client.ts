import axios from 'axios';

export const API_ROOT = 'http://192.168.100.43:4000';
export const API_URL = `${API_ROOT}/api`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
