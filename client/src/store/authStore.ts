import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosClient from "../api/axiosClient";
import { useChatStore } from "./chatStore";

// -------- Types --------
interface User {
  _id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  token: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  register: (name: string, email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<boolean>;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

// -------- Store --------
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      register: async (name, email, password) => {
        try {
          set({ loading: true, error: null });
          const res = await axiosClient.post<User>("auth/register", {
            name,
            email,
            password,
          });
          return res.data;
        } catch (err: unknown) {
          const message =
            (err as ErrorResponse)?.response?.data?.message ||
            "Registration failed";
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ loading: false });
        }
      },

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const res = await axiosClient.post<LoginResponse>("auth/login", {
            email,
            password,
          });

          const token = res.data.token;
          set({ token });
          localStorage.setItem("token", token);

          await get().fetchUser();
          return true;
        } catch (err: unknown) {
          const message =
            (err as ErrorResponse)?.response?.data?.message || "Login failed";
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ loading: false });
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await axiosClient.get<User>("auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ user: res.data });
        } catch {
          localStorage.removeItem("token");
          set({ user: null, token: null });
        }
      },

      logout: () => {
        useChatStore.getState().reset();
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
