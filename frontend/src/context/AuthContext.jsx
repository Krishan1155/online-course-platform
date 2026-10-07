import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.data.token);
    setUser({
      _id: data.data._id,
      name: data.data.name,
      email: data.data.email,
      role: data.data.role,
      isVerified: data.data.isVerified,
    });
    return data.data;
  };


  const googleLogin = async (credential) => {
  const { data } = await api.post('/auth/google', {
    credential,
  });

  localStorage.setItem('token', data.data.token);

  setUser({
    _id: data.data._id,
    name: data.data.name,
    email: data.data.email,
    role: data.data.role,
    isVerified: data.data.isVerified,
  });

  return data.data;
};


  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const setToken = (token) => {
    localStorage.setItem('token', token);
    loadUser();
  };

  const value = {
    user,
    loading,
    login,
    googleLogin,
    register,
    logout,
    updateUser,
    setToken,
    loadUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {               //custom hook
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
