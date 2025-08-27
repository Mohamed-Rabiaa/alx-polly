import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterCredentials } from '@/app/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock user data for demonstration
const mockUsers = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock authentication logic
          const user = mockUsers.find(u => u.email === credentials.email);
          
          if (user && credentials.password === 'password') {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Invalid email or password');
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if user already exists
          const existingUser = mockUsers.find(u => u.email === credentials.email);
          if (existingUser) {
            throw new Error('User with this email already exists');
          }
          
          // Create new user
          const newUser: User = {
            id: Date.now().toString(),
            email: credentials.email,
            name: credentials.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          mockUsers.push(newUser);
          
          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
