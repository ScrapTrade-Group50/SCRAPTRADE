import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, mapBackendRole } from '../api/client';
import { useSavedStore } from './savedStore';

type UserRole = 'artisan' | 'factory' | null;

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  role: UserRole;
  userId: number | null;
  companyName: string | null;
  phoneNumber: string | null;
  email: string | null;
  login: (role: UserRole, userId: number, companyName: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateProfile: (companyName: string, phoneNumber: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isHydrated: false,
  role: null,
  userId: null,
  companyName: null,
  phoneNumber: null,
  email: null,

  login: async (role, userId, companyName) => {
    await AsyncStorage.multiSet([
      ['userRole', role ?? ''],
      ['userId', String(userId)],
      ['companyName', companyName],
    ]);
    set({ isAuthenticated: true, isHydrated: true, role, userId, companyName });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'companyName', 'phoneNumber', 'email']);
    useSavedStore.getState().reset();
    set({
      isAuthenticated: false,
      isHydrated: true,
      role: null,
      userId: null,
      companyName: null,
      phoneNumber: null,
      email: null,
    });
  },

  hydrate: async () => {
    if (get().isHydrated) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        set({ isHydrated: true });
        return;
      }

      const response = await apiClient.get('/auth/me', { timeout: 5000 });
      const role = mapBackendRole(response.data.role);
      const userId = response.data.userId as number;
      const companyName = response.data.companyName as string;
      const phoneNumber = (response.data.phoneNumber as string) ?? '';
      const email = response.data.email as string;

      await AsyncStorage.multiSet([
        ['userRole', role],
        ['userId', String(userId)],
        ['companyName', companyName],
        ['phoneNumber', phoneNumber],
        ['email', email],
      ]);

      set({ isAuthenticated: true, role, userId, companyName, phoneNumber, email });
    } catch {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'companyName', 'phoneNumber', 'email']);
      set({
        isAuthenticated: false,
        role: null,
        userId: null,
        companyName: null,
        phoneNumber: null,
        email: null,
      });
    } finally {
      set({ isHydrated: true });
    }
  },

  updateProfile: async (companyName, phoneNumber) => {
    const response = await apiClient.patch('/auth/me', { companyName, phoneNumber });
    const updatedName = response.data.companyName as string;
    const updatedPhone = (response.data.phoneNumber as string) ?? '';

    await AsyncStorage.multiSet([
      ['companyName', updatedName],
      ['phoneNumber', updatedPhone],
    ]);

    set({ companyName: updatedName, phoneNumber: updatedPhone });
  },
}));
