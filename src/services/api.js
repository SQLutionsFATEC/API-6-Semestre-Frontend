
import axios from 'axios';
import {
  getAccessToken,
  restartLoginAfterUnauthorized,
} from './keycloak.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

const apiOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;

function isApiRequest(config) {
  const requestUrl = new URL(
    config.url || '',
    new URL(config.baseURL || api.defaults.baseURL, window.location.origin),
  );

  return requestUrl.origin === apiOrigin;
}

api.interceptors.request.use(async (config) => {
  if (!isApiRequest(config)) return config;

  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config &&
      isApiRequest(error.config)
    ) {
      restartLoginAfterUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default api;