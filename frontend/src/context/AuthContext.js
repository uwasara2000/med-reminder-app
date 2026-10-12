import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeniorMode, setIsSeniorMode] = useState(true); // Default to Senior Friendly Mode!

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      const storedUser = await AsyncStorage.getItem('@auth_user');
      const storedSenior = await AsyncStorage.getItem('@senior_mode');

      if (storedSenior !== null) {
        setIsSeniorMode(storedSenior === 'true');
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Failed to load auth session:', e?.message || e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(email, password);
      if (res.data && res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        if (newUser.seniorMode !== undefined) {
          setIsSeniorMode(newUser.seniorMode);
          await AsyncStorage.setItem('@senior_mode', String(newUser.seniorMode));
        }
        await AsyncStorage.setItem('@auth_token', newToken);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed.' };
    } catch (error) {
      const msg = error.response?.data?.message || (error.message ? `Connection failed (${error.message}). Please ensure backend is running.` : 'Invalid email or password.');
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const res = await authApi.register(userData);
      if (res.data && res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        await AsyncStorage.setItem('@auth_token', newToken);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed.' };
    } catch (error) {
      const msg = error.response?.data?.message || (error.message ? `Connection failed (${error.message}). Please ensure backend is running.` : 'Registration error.');
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@auth_user');
    } catch (e) {
      console.log('Error during logout:', e?.message || e);
    }
  };

  const toggleSeniorMode = async () => {
    const nextVal = !isSeniorMode;
    setIsSeniorMode(nextVal);
    await AsyncStorage.setItem('@senior_mode', String(nextVal));
    if (user) {
      try {
        await authApi.updateProfile({ seniorMode: nextVal });
      } catch (e) {
        // Ignore background sync errors
      }
    }
  };

  const switchDemoAccount = async (role = 'patient') => {
    if (role === 'patient') {
      return login('arthur@example.com', 'password123');
    } else {
      return login('sarah@example.com', 'password123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        isSeniorMode,
        toggleSeniorMode,
        login,
        register,
        logout,
        switchDemoAccount,
        isCaregiver: user?.role === 'caregiver'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
