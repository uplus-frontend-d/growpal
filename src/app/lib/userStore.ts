import { create } from "zustand";
import { persist } from "zustand/middleware";

// users 테이블 구조에 맞춘 사용자 타입 정의
interface CustomUser {
  id: string;
  email: string;
  provider?: string; // 쉼표로 구분된 provider 문자열 (예: "google,github")
  created_at: string;
}

interface UserState {
  user: CustomUser | null;
  isLoading: boolean;
  setUser: (user: CustomUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false, // 초기에는 로딩 안함
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage", // localStorage 키 이름
      partialize: (state) => ({ user: state.user }), // user만 저장 (isLoading은 저장하지 않음)
    }
  )
);
