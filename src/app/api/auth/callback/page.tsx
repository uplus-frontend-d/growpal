"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useUserData } from "@/app/lib/useUserData";

export default function AuthCallback() {
  const router = useRouter();
  const { getUserData } = useUserData();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 타임아웃 설정 (30초)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("인증 처리 시간이 초과되었습니다.")),
            30000
          );
        });

        const authPromise = async () => {
          // 잠시 대기 (Supabase가 세션을 설정할 시간을 줌)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 현재 세션 확인
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("세션 확인 오류:", sessionError);
            throw new Error("세션 확인 중 오류가 발생했습니다.");
          }

          if (!session?.user) {
            throw new Error(
              "사용자 세션이 없습니다. OAuth 인증이 완료되지 않았습니다."
            );
          }

          // useUserData를 통해 사용자 데이터 처리
          const result = await getUserData();

          if (!result.success) {
            console.error("사용자 데이터 처리 오류:", result.error);
            throw new Error("사용자 데이터 처리 중 오류가 발생했습니다.");
          }

          // 성공 시 메인 페이지로 리다이렉트
          router.push("/");
        };

        // 타임아웃과 함께 실행
        await Promise.race([authPromise(), timeoutPromise]);
      } catch (error: any) {
        console.error("OAuth 콜백 오류:", error);

        // 네트워크 오류 처리
        if (
          error.message?.includes("fetch") ||
          error.message?.includes("network")
        ) {
          setError("네트워크 연결을 확인해주세요.");
        } else if (error.message?.includes("시간이 초과")) {
          setError("인증 처리 시간이 초과되었습니다. 다시 시도해주세요.");
        } else {
          setError(error.message || "서버 오류가 발생했습니다.");
        }
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, getUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            로그인 처리 중...
          </h2>
          <p className="text-gray-600 text-sm">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            로그인 실패
          </h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/login")}
              className="bg-green-700 text-white py-2 px-4 rounded-lg hover:bg-green-800 transition-colors mr-2"
            >
              로그인 페이지로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
