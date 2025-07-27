"use client";

import { useEffect } from "react";
import { useUserStore } from "./lib/userStore";
import { useUserData } from "./lib/useUserData";
import Navigation from "./components/Navigation";
import LoginForm from "./components/LoginForm";

export default function Home() {
  const { user, isLoading } = useUserStore();
  const { getUserData } = useUserData();

  // 페이지 로드 시 사용자 상태 확인
  useEffect(() => {
    if (!user) {
      getUserData();
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
        {isLoading ? (
          // 로딩 상태
          <div className="w-80">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">⏳ 로딩 중...</p>
              </div>
            </div>
          </div>
        ) : user ? (
          // 로그인된 상태 - 환영 메시지
          <div className="w-80">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="text-center">
                <div className="text-4xl mb-3">🌱</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  환영합니다!
                </h2>
                <p className="text-gray-600 text-sm">
                  Plant Care에 오신 것을 환영합니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 로그인되지 않은 상태
          <div className="w-80">
            {/* 타이틀 섹션 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Plant Care
              </h1>
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
