import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: !!data.user,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    window.location.href = '/api/login';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    refetch: fetchUser,
  };
}
