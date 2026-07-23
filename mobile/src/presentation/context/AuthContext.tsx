import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../domain/types';
import { TokenStorage } from '../../core/utils/storage';
import { apiClient } from '../../core/utils/http';
import { API_ENDPOINTS } from '../../core/constants/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  setUserRoleOverride?: (role: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await TokenStorage.getUser();
      const token = await TokenStorage.getAccessToken();
      if (storedUser && token) {
        setUser(storedUser);
      }
    } catch (err) {
      await TokenStorage.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    const { access, refresh, user: loggedUser } = res.data;
    await TokenStorage.setTokens(access, refresh);
    await TokenStorage.setUser(loggedUser);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData: any): Promise<User> => {
    await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    // Auto-login after successful registration
    return login(userData.email, userData.password);
  };

  const logout = async () => {
    await TokenStorage.clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
