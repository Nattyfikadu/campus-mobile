import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export type UserRole = 'student' | 'visitor' | 'staff' | 'office' | 'admin';

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  faculty?: string;
  studentId?: string;
  staffId?: string;
  phone?: string;
  position?: string;
};

export type RegisterData = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  staffId?: string;
  phone?: string;
  department?: string;
  faculty?: string;
  position?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAllStaff: () => Promise<User[]>;
};

const USER_STORAGE_KEY = 'campus-mobile-user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'Auth provider not ready' }),
  register: async () => ({ success: false, error: 'Auth provider not ready' }),
  logout: async () => {},
  getAllStaff: async () => [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (error) {
        console.error('Failed to restore auth state', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const persistUser = async (nextUser: User | null) => {
    if (nextUser) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      return;
    }

    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const nextUser = response.data.user as User;
      setUser(nextUser);
      await persistUser(nextUser);
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to login. Please try again.';
      return { success: false, error: message };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const nextUser = response.data.user as User;
      setUser(nextUser);
      await persistUser(nextUser);
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await persistUser(null);
    } catch (error) {
      console.error('Failed to clear auth state', error);
    }
  };

  const getAllStaff = async () => {
    try {
      const response = await apiClient.get('/auth/staff');
      return response.data as User[];
    } catch (error) {
      console.error('Failed to fetch staff list', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        getAllStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
