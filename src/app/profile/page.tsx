"use client";

import { useUserStore } from "../lib/userStore";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/Layout";
import DeleteAccountModal from "../components/DeleteAccountModal";
import { useState } from "react";

export default function ProfilePage() {
  const { user, clearUser } = useUserStore();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      setDeleteError("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // 현재 세션에서 액세스 토큰 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
      }

      // 회원 탈퇴 API 호출
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회원 탈퇴 중 오류가 발생했습니다.");
      }

      // 성공적으로 삭제된 경우
      setIsDeleteModalOpen(false);

      // Supabase 로그아웃 (Auth 세션 종료)
      await supabase.auth.signOut();

      // Zustand 상태 초기화
      clearUser();

      // 메인 페이지로 이동
      router.push("/");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "회원 탈퇴 중 오류가 발생했습니다."
      );
    } finally {
      setIsDeleting(false);
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

            {/* 오류 메시지들 */}
            {logoutError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {logoutError}
              </div>
            )}

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {deleteError}
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
                    {(() => {
                      if (!user?.provider) return "이메일";

                      console.log("=== 프로필 페이지 - provider 정보 ===", {
                        provider: user.provider,
                        providerType: typeof user.provider,
                        providerLength: user.provider?.length,
                        providerIncludesComma: user.provider?.includes(","),
                        providerSplit: user.provider?.split(","),
                      });

                      // provider가 쉼표로 구분된 문자열인 경우
                      if (
                        typeof user.provider === "string" &&
                        user.provider.includes(",")
                      ) {
                        const providers = user.provider
                          .split(",")
                          .map((p) => p.trim())
                          .filter((p) => p.length > 0);

                        console.log("분리된 providers:", providers);

                        return providers
                          .map((provider) => {
                            switch (provider) {
                              case "google":
                                return "Google";
                              case "github":
                                return "GitHub";
                              case "email":
                                return "이메일";
                              default:
                                return provider;
                            }
                          })
                          .join(", ");
                      }

                      // 단일 provider인 경우
                      switch (user.provider) {
                        case "google":
                          return "Google";
                        case "github":
                          return "GitHub";
                        case "email":
                          return "이메일";
                        default:
                          return user.provider;
                      }
                    })()}
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

              {/* 회원 탈퇴 버튼 */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md font-medium transition-colors text-sm"
                >
                  🗑️ 회원 탈퇴
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  회원 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 탈퇴 확인 모달 */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
          isLoading={isDeleting}
        />
      </Layout>
    </PrivateRoute>
  );
}
