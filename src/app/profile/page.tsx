"use client";

import { useUserStore } from "../lib/userStore";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/Layout";
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
      <Layout subtitle="프로필">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              👤 프로필 정보
            </h1>

            {/* 로그아웃 오류 메시지 */}
            {logoutError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {logoutError}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm">
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용자 ID
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-mono text-xs break-all">
                    {user?.id}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로그인 방식
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm">
                    {user?.provider === "google" ? "Google" : "이메일"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가입일
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm">
                    {user?.created_at &&
                      new Date(user.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                  홈으로
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
