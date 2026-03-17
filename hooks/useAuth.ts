/**
 * hooks/useAuth.ts — Auth state management
 *
 * Stores JWT in AsyncStorage. Exposes login, signup, logout, and current user.
 * Import this hook anywhere you need auth context.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/api';

const TOKEN_KEY = 'pulse_auth_token';
const USER_KEY  = 'pulse_auth_user';

export interface AuthUser {
  user_id:  string;
  username: string;
  token:    string;
}

interface AuthState {
  user:      AuthUser | null;
  loading:   boolean;
  error:     string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token && userStr) {
          setState({ user: JSON.parse(userStr), loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      } catch {
        setState({ user: null, loading: false, error: null });
      }
    })();
  }, []);

  const _save = useCallback(async (user: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, user.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, loading: false, error: null });
  }, []);

  const signup = useCallback(async (username: string, pin: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, pin }),
      });
      if (!res.ok) {
        const err = await res.json();
        setState(s => ({ ...s, loading: false, error: err.detail || 'Signup failed' }));
        return false;
      }
      const data = await res.json();
      await _save({ user_id: data.user_id, username: data.username, token: data.token });
      return true;
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Could not reach server' }));
      return false;
    }
  }, [_save]);

  const login = useCallback(async (username: string, pin: string): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, pin }),
      });
      if (!res.ok) {
        const err = await res.json();
        setState(s => ({ ...s, loading: false, error: err.detail || 'Invalid username or PIN' }));
        return false;
      }
      const data = await res.json();
      await _save({ user_id: data.user_id, username: data.username, token: data.token });
      return true;
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Could not reach server' }));
      return false;
    }
  }, [_save]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return {
    user:       state.user,
    isLoggedIn: !!state.user,
    loading:    state.loading,
    error:      state.error,
    signup,
    login,
    logout,
    clearError,
  };
}

// ── Helper to get stored token synchronously for one-off API calls ────────────
export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}