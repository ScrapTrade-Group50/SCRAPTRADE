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

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url as string | undefined;
      if (url && !url.includes('/auth/login') && !url.includes('/auth/register')) {
        await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'companyName']);
      }
    }
    return Promise.reject(error);
  }
);

export function mapBackendRole(role: string): 'artisan' | 'factory' {
  return role === 'FACTORY_SELLER' ? 'factory' : 'artisan';
}
