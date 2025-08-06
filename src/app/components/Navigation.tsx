"use client";

import { useRouter } from "next/navigation";
import { useUserStore } from "../lib/userStore";
import { supabase } from "../lib/supabaseClient";
import { useState } from "react";

export default function Navigation() {
  const { user, clearUser } = useUserStore();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setLogoutError(null);
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 실패:", error);
        setLogoutError("로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.");
        return;
      }

      // Zustand 상태 초기화
      clearUser();

      // 메인 페이지로 이동
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      setLogoutError("로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex justify-around items-center">
        <button
          onClick={() => router.push("/plants")}
          className="flex flex-col items-center space-y-1"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs text-gray-700">Plants</span>
        </button>
        <button
          className="flex flex-col items-center space-y-1"
          onClick={() => router.push("/calendar")}
        >
          <i className="fa-solid fa-calendar w-6 h-6" />
          <span className="text-xs text-gray-700">Calendar</span>
        </button>
        <button
          onClick={() => router.push("/plants/add")}
          className="flex flex-col items-center space-y-1"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-xs text-gray-700">Add</span>
        </button>
        {user ? (
          // 로그인 상태 - 프로필 버튼
          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center space-y-1"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs text-gray-700">Profile</span>
          </button>
        ) : (
          // 비로그인 상태 - 로그인 버튼
          <button
            onClick={() => router.push("/login")}
            className="flex flex-col items-center space-y-1"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs text-gray-700">Login</span>
          </button>
        )}
      </div>

      {/* 로그아웃 오류 메시지 */}
      {logoutError && (
        <div className="mt-2 text-red-600 text-xs text-center bg-red-50 p-2 rounded-md border border-red-200">
          {logoutError}
        </div>
      )}
    </div>
  );
}
