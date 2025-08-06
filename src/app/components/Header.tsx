"use client";

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // 페이지별 제목 매핑
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "GrowPal 🌱";
      case "/plants":
        return "GrowPal 🌱 내 식물 목록";
      case "/plants/add":
        return "GrowPal 🌱 식물 추가";
      case "/calendar":
        return "GrowPal 📅 캘린더";
      case "/profile":
        return "GrowPal 👤 프로필";
      case "/login":
        return "GrowPal 🔐 로그인";
      case "/signup":
        return "GrowPal 📝 회원가입";
      case "/forgot-password":
        return "GrowPal 🔑 비밀번호 찾기";
      case "/reset-password":
        return "GrowPal 🔑 비밀번호 재설정";
      default:
        // 동적 라우트 (예: /plants/[plant_id])
        if (pathname.startsWith("/plants/") && pathname !== "/plants/add") {
          return "GrowPal 🌱 식물 상세";
        }
        return "GrowPal 🌱";
    }
  };

  // GrowPal과 나머지 부분을 분리
  const title = getPageTitle();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 홈페이지가 아닌 경우 GrowPal과 나머지를 분리해서 표시
  const growpalPart = "GrowPal";
  const restPart = title.replace("GrowPal ", "");

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-gray-900">
              <span className="text-2xl font-bold text-green-600">
                {growpalPart}
              </span>
              <span className="text-xl font-semibold text-gray-700 ml-2">
                {restPart}
              </span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
