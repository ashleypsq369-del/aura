/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

// Context defined at module level - exported so useAuth.js can import it
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password, fullName, role, phone, linkedPatientId) => {
    try {
      const response = await authAPI.register({
        username,
        email,
        password,
        full_name: fullName,
        role,
        phone,
        linked_patient_id: linkedPatientId ? parseInt(linkedPatientId) : null
      });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to request password reset'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await authAPI.resetPassword({ token, new_password: newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Password reset failed'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to change password'
      };
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Call backend logout endpoint (audit logs tracking)
      await authAPI.logout();
    } catch {
      // Proceed even if backend call fails
    }
    
    // Simulate brief transition (1.5 seconds)
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggingOut(false);
    }, 1500);
  };

  const updateUserLocal = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  // Refresh user data from backend - call after admin changes care_setting or verification
  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const freshUser = response.data;
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      // Non-fatal - user stays as-is
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoggingOut, 
      login, 
      register, 
      forgotPassword, 
      resetPassword, 
      changePassword, 
      logout, 
      updateUserLocal,
      refreshUser,
      setUser,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
