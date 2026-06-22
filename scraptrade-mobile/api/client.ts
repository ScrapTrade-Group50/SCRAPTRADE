import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE THIS with your computer's actual IPv4 address on your WiFi network
// e.g., 'http://192.168.1.15:8080/api'
const BASE_URL = 'https://ee385f83a672e1.lhr.life/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// This acts like the "Bouncer" for our frontend.
// Before ANY request leaves the phone, it automatically attaches the JWT wristband!
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
