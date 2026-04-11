import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
}

const AUTH_TOKEN_KEY = '@vocalaize:auth_token';
const USER_KEY = '@vocalaize:user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Mock login - replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        name: 'Test User',
      };
      const mockToken = 'mock-jwt-token';

      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser)),
      ]);

      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Mock registration - replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        name,
      };
      const mockToken = 'mock-jwt-token';

      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser)),
      ]);

      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };
}
