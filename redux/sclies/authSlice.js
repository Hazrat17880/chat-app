import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  email: null,
  token: null,
  refreshToken: null, // ✅ Move refreshToken here
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set email
    setUserEmail: (state, action) => {
      state.email = action.payload;
    },
    
    // Clear email
    clearUserEmail: (state) => {
      state.email = null;
    },
    
    // Set user
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (action.payload?.email) {
        state.email = action.payload.email;
      }
    },
    
    // Set auth token
    setAuthToken: (state, action) => {
      state.token = action.payload;
    },
    
    // Set refresh token
    setRefreshToken: (state, action) => {
      state.refreshToken = action.payload;
    },
    
    // Set full user data
    setUserData: (state, action) => {
      state.user = action.payload.user;
      state.email = action.payload.email;
      state.userId = action.payload.userId;
    },
    
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
   loginSuccess: (state, action) => {
  state.user = action.payload.user;
  state.email = action.payload.email;
  state.token = action.payload.token;
  state.refreshToken = action.payload.refreshToken || null;
  state.isAuthenticated = true;
  state.loading = false;
  state.error = null;
},
    
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    logout: (state) => {
      state.user = null;
      state.email = null;
      state.token = null;
      state.refreshToken = null; // ✅ Clear refreshToken on logout
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUserEmail,
  clearUserEmail,
  setUser,
  setAuthToken,
  setRefreshToken,
  setUserData,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;