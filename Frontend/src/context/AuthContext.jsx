import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import api from '../services/api';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('kanban_token') || '',
  loading: true,
  error: '',
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, error: '', loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: '', error: '', loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('kanban_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: currentUser.user });
      } catch (error) {
        localStorage.removeItem('kanban_token');
        dispatch({ type: 'SET_ERROR', payload: 'Session expired. Please login again.' });
      }
    };

    bootstrap();
  }, []);

  const login = async (values) => {
    const response = await authService.login(values);
    const { token, user } = response;
    localStorage.setItem('kanban_token', token);
    dispatch({ type: 'SET_USER', payload: user });
    return response;
  };

  const register = async (values) => {
    const response = await authService.register(values);
    const { token, user } = response;
    localStorage.setItem('kanban_token', token);
    dispatch({ type: 'SET_USER', payload: user });
    return response;
  };

  const logout = () => {
    localStorage.removeItem('kanban_token');
    dispatch({ type: 'LOGOUT' });
  };

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
