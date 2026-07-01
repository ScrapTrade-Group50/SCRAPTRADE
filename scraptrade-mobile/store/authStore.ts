import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, mapBackendRole } from '../api/client';

type UserRole = 'artisan' | 'factory' | null;

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  role: UserRole;
  userId: number | null;
  companyName: string | null;
  login: (role: UserRole, userId: number, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrated: false,
  role: null,
  userId: null,
  companyName: null,

  login: async (role, userId, companyName) => {
    await AsyncStorage.multiSet([
      ['userRole', role ?? ''],
      ['userId', String(userId)],
      ['companyName', companyName],
    ]);
    set({ isAuthenticated: true, role, userId, companyName });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'companyName']);
    set({ isAuthenticated: false, role: null, userId: null, companyName: null });
  },

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        set({ isHydrated: true });
        return;
      }

      const response = await apiClient.get('/auth/me');
      const role = mapBackendRole(response.data.role);
      const userId = response.data.userId as number;
      const companyName = response.data.companyName as string;

      await AsyncStorage.multiSet([
        ['userRole', role],
        ['userId', String(userId)],
        ['companyName', companyName],
      ]);

      set({ isAuthenticated: true, role, userId, companyName, isHydrated: true });
    } catch {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'companyName']);
      set({ isAuthenticated: false, role: null, userId: null, companyName: null, isHydrated: true });
    }
  },
}));
