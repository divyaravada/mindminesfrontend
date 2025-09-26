// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const stored = localStorage.getItem("authTokens");
const initialTokens = stored ? JSON.parse(stored) : null;

const initialState = {
  access: initialTokens?.access || null,
  refresh: initialTokens?.refresh || null,
  user: initialTokens?.access ? jwtDecode(initialTokens.access) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { access, refresh } = action.payload || {};
      state.access = access || null;
      state.refresh = refresh || null;
      state.user = access ? jwtDecode(access) : null;

      // keep axios-compatible storage in sync
      if (access && refresh) {
        localStorage.setItem("authTokens", JSON.stringify({ access, refresh }));
      } else if (access) {
        const prev = JSON.parse(localStorage.getItem("authTokens") || "{}");
        localStorage.setItem("authTokens", JSON.stringify({ ...prev, access }));
      }
    },
    logout: (state) => {
      state.access = null;
      state.refresh = null;
      state.user = null;
      localStorage.removeItem("authTokens");
    },
    hydrateFromStorage: (state) => {
      const raw = localStorage.getItem("authTokens");
      if (raw) {
        const t = JSON.parse(raw);
        state.access = t.access || null;
        state.refresh = t.refresh || null;
        state.user = t.access ? jwtDecode(t.access) : null;
      }
    },
  },
});

export const { setCredentials, logout, hydrateFromStorage } = authSlice.actions;
export const selectAccessToken = (state) => state.auth?.access || null;
export const selectRefreshToken = (state) => state.auth?.refresh || null;
export const selectUser = (state) => state.auth?.user || null;
export const selectIsAuthenticated = (state) => Boolean(state.auth?.access);

export default authSlice.reducer;
