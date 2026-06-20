import { create } from 'zustand';

// Define the types for our state
type UserRole = 'artisan' | 'factory' | null;

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

// Create the global store
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  
  // Action to log the user in and set their role
  login: (role) => set({ isAuthenticated: true, role }),
  
  // Action to log the user out and clear their data
  logout: () => set({ isAuthenticated: false, role: null }),
}));