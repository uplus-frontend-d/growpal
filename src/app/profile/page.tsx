"use client";

import { useUserStore } from "../lib/userStore";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import PrivateRoute from "../components/PrivateRoute";
import { useState } from "react";

export default function ProfilePage() {
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
    <PrivateRoute>
      <div className="bg-white">
        {/* 상단 식물 이미지 섹션 */}
        <div className="w-full h-64 bg-amber-50 flex items-center justify-center">
          <div className="w-80 h-48 bg-amber-100 p-2 rounded-lg shadow-lg">
            <div className="w-full h-full bg-amber-50 rounded-md overflow-hidden">
              <img
                src="/plant-image.jpg"
                alt="Plant Care"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 섹션 */}
        <div className="px-6 py-8 pb-24 flex flex-col items-center">
          {/* 타이틀 섹션 */}
          <div className="text-center mb-8 w-80">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Plant Care
            </h2>
            <p className="text-gray-600 text-base">Your personal plant care</p>
            <p className="text-gray-600 text-base">profile.</p>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="w-80 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Email</span>
                <span className="text-black font-semibold">{user?.email}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">User ID</span>
                <span className="text-black font-mono text-sm text-right">
                  {user?.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Provider</span>
                <span className="text-black font-semibold">
                  {user?.provider || "Email"}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 font-medium">Joined</span>
                <span className="text-black">
                  {user?.created_at &&
                    new Date(user.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>

            {/* 로그아웃 오류 메시지 */}
            {logoutError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                {logoutError}
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <a
                href="/"
                className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                Home
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
