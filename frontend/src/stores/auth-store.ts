import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "reader" | "city_contact";
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem("auth_token");
      },
    }),
    { name: "auth-store" }
  )
);
