"use client";

import { useUserStore } from "../lib/userStore";
import { useUserData } from "../lib/useUserData";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useUserStore();
  const { getUserData } = useUserData();
  const router = useRouter();
  const [isInitialCheck, setIsInitialCheck] = useState(true); // 초기 체크 상태

  // 페이지 로드 시 사용자 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        // persist 데이터가 없으면 실제 인증 상태 확인
        await getUserData();
      }
      // 초기 체크 완료
      setIsInitialCheck(false);
    };

    checkUser();
  }, []);

  // 초기 체크가 끝나고 로딩도 끝났는데 user가 없으면 로그인 페이지로
  useEffect(() => {
    if (!isInitialCheck && !isLoading && !user) {
      router.push("/login");
    }
  }, [isInitialCheck, isLoading, user, router]);

  // 초기 체크 중이거나 로딩 중이거나 user가 없을 때
  if (isInitialCheck || isLoading || !user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-blue-600 text-lg font-medium">⏳ 로딩 중...</div>
      </div>
    );
  }

  // 인증이 완료되면 children 렌더링
  return <>{children}</>;
}
