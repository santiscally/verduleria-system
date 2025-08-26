// frontend/src/services/auth.service.ts

import api from '@/lib/api';
import { ILoginRequest, ILoginResponse, IApiResponse } from '@/types';

export const authService = {
  login: async (credentials: ILoginRequest) => {
    const response = await api.post<IApiResponse<ILoginResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // También guardar en cookies para el middleware
      document.cookie = `token=${response.data.data.token}; path=/; max-age=86400; SameSite=Lax`;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    window.location.href = '/login';
  },

  getMe: async () => {
    try {
      const response = await api.get<IApiResponse<{ id: number; username: string }>>('/auth/me');
      return response.data;
    } catch (error) {
      // Si falla, limpiar todo
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post<IApiResponse<null>>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};