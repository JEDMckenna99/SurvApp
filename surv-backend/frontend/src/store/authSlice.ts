import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  verificationMethod: string | null;  // 'lemma', 'password', 'magic-link'
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'access_token',
  USER: 'user',
  LEMMA_CREDENTIALS: 'lemma_credentials',
};

// Load initial state from localStorage
const loadStoredAuth = (): { user: User | null; token: string | null } => {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken || null,
    };
  } catch {
    return { user: null, token: null };
  }
};

const stored = loadStoredAuth();

const initialState: AuthState = {
  user: stored.user,
  token: stored.token,
  isAuthenticated: !!stored.token,
  loading: false,
  verificationMethod: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    
    loginSuccess: (state, action: PayloadAction<{ 
      user: User; 
      token: string;
      verificationMethod?: string;
    }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.verificationMethod = action.payload.verificationMethod || 'password';
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, action.payload.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
    },
    
    loginFailure: (state) => {
      state.loading = false;
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.verificationMethod = null;
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.LEMMA_CREDENTIALS);
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
      }
    },
    
    setVerificationMethod: (state, action: PayloadAction<string>) => {
      state.verificationMethod = action.payload;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout,
  updateUser,
  setVerificationMethod,
} = authSlice.actions;

export default authSlice.reducer;
