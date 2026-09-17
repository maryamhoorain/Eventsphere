import { create } from "zustand";
import { endpoints, setToken } from "../api/client";
import { validateStrongPassword } from "../utils/password";

const SESSION_KEY = "eventsphere.session";

export const useSession = create((set, get) => ({
  user: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (user?.token) setToken(user.token);
      else setToken(null);

      if (user?.token) {
        const response = await endpoints.auth.me();
        const currentUser = {
          ...user,
          ...response.user,
          token: user.token,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        set({ user: currentUser, hydrated: true });
        return;
      }

      set({ user, hydrated: true });
    } catch {
      setToken(null);
      localStorage.removeItem(SESSION_KEY);
      set({ user: null, hydrated: true });
    }
  },
  login: async (email, password) => {
    try {
      const data = await endpoints.auth.login({ email, password });
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      };
      setToken(data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      set({ user });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
        requiresVerification:
          e.status === 403 &&
          e.message === "Please verify your email before logging in",
      };
    }
  },
  register: async ({ name, email, password, phone }) => {
    try {
      const data = await endpoints.auth.register({
        name,
        email,
        password,
        phone,
      });
      return {
        ok: true,
        user: data.user,
        requiresVerification: !data.user?.emailVerified,
        message: data.message,
        verificationEmailSent: data.verificationEmailSent,
        verificationUrl: data.verificationUrl,
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  verifyEmail: async (token) => {
    try {
      const data = await endpoints.auth.verifyEmail(token);
      return { ok: true, message: data.message };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  resendVerification: async (email) => {
    try {
      const data = await endpoints.auth.resendVerification(email);
      return {
        ok: true,
        message: data.message,
        verificationUrl: data.verificationUrl,
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
    set({ user: null });
  },
  updateProfile: (patch) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...patch };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    set({ user: next });
  },
  listUsers: () => [],
  setRole: () => {},
  forgotPassword: async (email) => {
    try {
      const data = await endpoints.auth.forgotPassword(email);
      return { ok: true, resetToken: data.resetToken };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  resetPassword: async (token, password) => {
    const validation = validateStrongPassword(password);

    if (!validation.valid) {
      return {
        ok: false,
        error: validation.message,
      };
    }

    try {
      await endpoints.auth.resetPassword(token, password);

      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  },
}));
