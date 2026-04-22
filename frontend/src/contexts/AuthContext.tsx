import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 获取或生成 deviceId
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// 生成简单的设备指纹
const generateFingerprint = async () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ];
  const str = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // 检查是否是同一天，如果不是则自动刷新用户信息以获取最新的试衣次数
        const today = new Date().toDateString();
        const savedDate = parsedUser._lastCheckDate;
        if (savedDate !== today) {
          // 跨天了，自动刷新用户信息重置次数
          try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify({ ...userData, _lastCheckDate: today }));
          } catch (error) {
            // Token 可能已过期，尝试游客登录
            await doGuestLogin();
          }
        }
      } else {
        // 没有 token，自动游客登录
        await doGuestLogin();
      }
      setLoading(false);
    };

    const doGuestLogin = async () => {
      try {
        const deviceId = getDeviceId();
        const fingerprint = await generateFingerprint();
        const response = await authAPI.guestLogin(deviceId, fingerprint);
        login(response.access_token, response.user);
      } catch (error) {
        console.error('自动游客登录失败:', error);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    const today = new Date().toDateString();
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify({ ...newUser, _lastCheckDate: today }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authAPI.logout();
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
