// src/features/auth/authApi.js
import { api } from "../../services/apiSlice";
import { setCredentials, logout } from "./authSlice";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: ({ email, password }) => ({
        url: "token/",
        method: "POST",
        body: { email, password },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled; // { access, refresh }
          dispatch(
            setCredentials({ access: data.access, refresh: data.refresh })
          );
        } catch {}
      },
    }),
    register: build.mutation({
      query: (body) => ({ url: "users/register/", method: "POST", body }),
    }),
    googleAuth: build.mutation({
      query: ({ token }) => ({
        url: "users/auth/google/",
        method: "POST",
        body: { token },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ access: data.access, refresh: data.refresh })
          );
        } catch {}
      },
    }),
    facebookAuth: build.mutation({
      query: ({ token }) => ({
        url: "users/login/facebook/",
        method: "POST",
        body: { token },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ access: data.access, refresh: data.refresh })
          );
        } catch {}
      },
    }),
    requestPasswordReset: build.mutation({
      query: ({ email }) => ({
        url: "users/reset-password/",
        method: "POST",
        body: { email },
      }),
    }),
    resetPasswordConfirm: build.mutation({
      query: ({ uid, token, new_password1, new_password2 }) => ({
        url: `users/reset-password/${uid}/${token}/`,
        method: "POST",
        body: { new_password1, new_password2 },
      }),
    }),
    resendVerification: build.mutation({
      query: ({ email }) => ({
        url: "users/resend-verification/",
        method: "POST",
        body: { email },
      }),
    }),
    verifyEmail: build.query({
      query: ({ uidb64, token }) => `users/verify-email/${uidb64}/${token}/`,
    }),
    doLogout: build.mutation({
      queryFn: async (_arg, { dispatch }) => {
        dispatch(logout());
        return { data: { ok: true } };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleAuthMutation,
  useFacebookAuthMutation,
  useRequestPasswordResetMutation,
  useResetPasswordConfirmMutation,
  useResendVerificationMutation,
  useVerifyEmailQuery,
  useDoLogoutMutation,
} = authApi;
