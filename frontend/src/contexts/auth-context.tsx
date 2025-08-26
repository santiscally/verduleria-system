// frontend/src/contexts/auth-context.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { ILoginRequest } from '@/types';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: ILoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        setUser(null);
        setLoading(false);
        
        // Si no hay token y no estamos en login, redirigir
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      // Verificar que el token es válido
      const response = await authService.getMe();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token inválido
        authService.logout();
        setUser(null);
        
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // En caso de error, limpiar todo
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUser(null);
      
      if (pathname !== '/login') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: ILoginRequest) => {
    const response = await authService.login(credentials);
    if (response.success && response.data) {
      setUser(response.data.user);
      router.push('/');
    } else {
      throw new Error(response.error || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // No necesitamos router.push aquí porque authService.logout() ya hace window.location.href
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}