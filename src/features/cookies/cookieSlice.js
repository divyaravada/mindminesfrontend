// src/features/cookies/cookieSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { injectGTM, removeGTM, deleteAnalyticsCookies } from "../../utils/gtm";

const KEY = "mm_cookie_consent_v1";
const GTM_ID = process.env.REACT_APP_GTM_ID; // CRA-style env var

const defaultConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  decided: false,
};

const initialState = {
  open: false,
  consent: { ...defaultConsent },
};

export const initConsent = createAsyncThunk("cookies/init", async () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { open: true, consent: { ...defaultConsent, decided: false } };
    }
    const parsed = JSON.parse(raw);
    const safe = {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decided: !!parsed.decided,
    };
    // load GTM only if user allowed analytics
    if (safe.decided && safe.analytics) injectGTM(GTM_ID);
    return { open: false, consent: safe };
  } catch {
    return { open: true, consent: { ...defaultConsent, decided: false } };
  }
});

export const saveConsent = createAsyncThunk("cookies/save", async (consent) => {
  const decided = {
    essential: true,
    analytics: !!consent.analytics,
    marketing: !!consent.marketing,
    decided: true,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(decided));
  } catch {}
  if (decided.analytics) {
    injectGTM(GTM_ID);
  } else {
    // turn off GTM as best-effort and clear related cookies
    removeGTM();
    deleteAnalyticsCookies();
  }
  return decided;
});

const cookiesSlice = createSlice({
  name: "cookies",
  initialState,
  reducers: {
    openManager(state) {
      state.open = true;
    },
    closeManager(state) {
      state.open = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initConsent.fulfilled, (state, { payload }) => {
        state.open = payload.open;
        state.consent = payload.consent;
      })
      .addCase(saveConsent.fulfilled, (state, { payload }) => {
        state.consent = payload;
        state.open = false;
      });
  },
});

export const { openManager, closeManager } = cookiesSlice.actions;
export default cookiesSlice.reducer;
