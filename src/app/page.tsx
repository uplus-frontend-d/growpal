"use client";

import { useEffect, useCallback, useState } from "react";
import { useUserStore } from "./lib/userStore";
import { useUserData } from "./lib/useUserData";
import Navigation from "./components/Navigation";
import LoginForm from "./components/LoginForm";

export default function Home() {
  const { user, isLoading } = useUserStore();
  const { getUserData } = useUserData();
  const [error, setError] = useState<string | null>(null);

  // 페이지 로드 시 사용자 상태 확인
  useEffect(() => {
    const checkUserData = async () => {
      if (!user) {
        try {
          const result = await getUserData();
          if (
            result &&
            typeof result === "object" &&
            "success" in result &&
            !result.success
          ) {
            const errorMessage = (result as any).error;
            console.log("사용자 데이터 확인 결과:", errorMessage);

            // Provider 불일치 에러인 경우 사용자에게 표시
            if (
              errorMessage &&
              errorMessage.includes("이미") &&
              errorMessage.includes("가입하셨습니다")
            ) {
              setError(errorMessage);
            }
          }
        } catch (error) {
          console.error("사용자 데이터 확인 중 오류:", error);
          // 에러가 발생해도 앱은 계속 작동하도록 함
        }
      }
    };

    checkUserData();
  }, []); // 빈 의존성 배열로 변경하여 컴포넌트 마운트 시에만 실행

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // 에러 메시지를 표시한 후 URL에서 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
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
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="w-80 mb-6">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="text-red-600 text-xl mr-3">⚠️</div>
                <div>
                  <p className="text-sm font-medium">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 text-xs mt-2 hover:text-red-800 underline"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          /* 로딩 상태 */
          <div className="w-80">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">⏳ 로딩 중...</p>
              </div>
            </div>
          </div>
        ) : user ? (
          /* 로그인된 상태 - 환영 메시지 */
          <div className="w-80">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-center">
                <div className="text-4xl mb-3">🌱</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Plant Care에 오신 것을 환영합니다.
                </h1>
                <p className="text-gray-600 text-sm">
                  Plant Care에 오신 것을 환영합니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 로그인되지 않은 상태 */
          <div className="w-80">
            {/* 타이틀 섹션 */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Plant Care
              </h2>
              <p className="text-gray-600 text-base">
                Your personal guide to nurturing
              </p>
              <p className="text-gray-600 text-base">your green companions.</p>
            </div>
            {/* 로그인 폼 */}
            <LoginForm />
          </div>
        )}
      </div>

      {/* 하단 네비게이션 섹션 */}
      <Navigation />
    </div>
  );
}
