import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './authStorage';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await axios.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
    `${api.defaults.baseURL}/auth/refresh-token`,
    { refreshToken },
  );
  setTokens(response.data.data.tokens);
  return response.data.data.tokens.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      refreshPromise ||= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const token = await refreshPromise;
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
      clearTokens();
    }

    const message = error.response?.data?.message || error.message || 'API request failed';
    throw new ApiError(message, status, error.response?.data?.details);
  },
);

export const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};
