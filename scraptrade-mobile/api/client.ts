import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Set EXPO_PUBLIC_API_URL in your environment, e.g. http://192.168.1.15:8080/api
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function isPublicAuthRequest(url: string | undefined) {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

apiClient.interceptors.request.use(
  async (config) => {
    if (isPublicAuthRequest(config.url)) {
      return config;
    }
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function clearAuthSession() {
  await AsyncStorage.multiRemove([
    'userToken',
    'userRole',
    'userId',
    'companyName',
    'phoneNumber',
    'email',
  ]);
  // Lazy import avoids circular dependency with authStore → apiClient
  const { useAuthStore } = await import('../store/authStore');
  useAuthStore.setState({
    isAuthenticated: false,
    role: null,
    userId: null,
    companyName: null,
    phoneNumber: null,
    email: null,
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url as string | undefined;
    const hasBusinessMessage = Boolean(error.response?.data?.message);

    if (!url || isPublicAuthRequest(url)) {
      return Promise.reject(error);
    }

    // Spring's auth rejection (missing/expired token) returns a 401, or a 403 with
    // NO "message" (shape: { timestamp, status, error, path }). Our own business-rule
    // failures (wrong role, not your listing, etc.) come through GlobalExceptionHandler
    // as a 403 WITH a "message" — those must NOT log the user out.
    const isAuthFailure = status === 401 || (status === 403 && !hasBusinessMessage);

    if (isAuthFailure) {
      await clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export function mapBackendRole(role: string): 'artisan' | 'factory' {
  return role === 'FACTORY_SELLER' ? 'factory' : 'artisan';
}
