import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('voltnet_token'));
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Set axios auth header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('voltnet_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('voltnet_token');
    }
  }, [token]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('voltnet_token');
      if (!savedToken) {
        setAuthLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        const res = await axios.get(`${API}/auth/me`);
        setUser(res.data);
        setRole(res.data.role);
        setToken(savedToken);
      } catch {
        localStorage.removeItem('voltnet_token');
        localStorage.removeItem('voltnet_user');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const registerUser = async (name, email, password, address) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password, address });
    setToken(res.data.token);
    setUser(res.data.user);
    setRole(res.data.user.role);
    localStorage.setItem('voltnet_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const loginUser = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    setRole(res.data.user.role);
    localStorage.setItem('voltnet_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    localStorage.removeItem('voltnet_token');
    localStorage.removeItem('voltnet_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = useCallback((userData) => {
    setUser(userData);
    setRole(userData.role);
    localStorage.setItem('voltnet_user', JSON.stringify(userData));
  }, []);

  const selectRole = (r) => {
    setRole(r);
  };

  const isAuthenticated = !!token && !!user;
  const hasWallet = !!user?.wallet_id && !!user?.role;

  return (
    <AppContext.Provider value={{
      user, token, role, API, authLoading,
      isAuthenticated, hasWallet,
      registerUser, loginUser, logout,
      updateUser, selectRole
    }}>
      {children}
    </AppContext.Provider>
  );
}
