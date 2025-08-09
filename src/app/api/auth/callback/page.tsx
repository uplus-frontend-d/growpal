"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useUserStore } from "@/app/lib/userStore";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<string | null>(null);

  // OAuth 사용자 데이터 처리 함수
  const handleOAuthUserData = async (authUser: any, authProvider: string) => {
    try {
      // 1. 이메일과 provider 조합으로 기존 사용자 검색
      let existingUser = null;

      if (authUser.email) {
        const { data: emailUsers, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authUser.email);

        if (!emailError && emailUsers && emailUsers.length > 0) {
          // 같은 이메일과 provider를 가진 사용자 찾기
          existingUser = emailUsers.find(
            (user) =>
              user.email === authUser.email && user.provider === authProvider
          );
        }
      }

      // 2. 기존 사용자가 있는 경우 - 같은 provider로 로그인하는 경우만 허용
      if (existingUser) {
        // 같은 provider로 로그인하는 경우는 정상 처리
        if (existingUser.provider === authProvider) {
          return;
        }
        // 다른 provider로 로그인 시도하는 경우 - 새로운 사용자로 생성
      }

      // 3. 새로운 사용자인 경우 생성 (UUID는 Supabase가 자동 생성)
      let userEmail = authUser.email;
      if (!userEmail) {
        if (authProvider === "github") {
          userEmail = `github_${authUser.id.slice(0, 8)}@temp.com`;
        } else {
          userEmail = `user_${authUser.id.slice(0, 8)}@temp.com`;
        }
      }

      const insertData = {
        email: userEmail,
        created_at: new Date().toISOString(),
        provider: authProvider,
      };

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        // 중복 이메일 에러 처리
        if (
          insertError.code === "23505" &&
          insertError.message.includes("email")
        ) {
          throw new Error("이미 해당 이메일로 가입된 계정이 존재합니다.");
        }
        throw new Error("사용자 계정 생성 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("OAuth 사용자 데이터 처리 오류:", error);
      throw error;
    }
  };

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
          // 세션이 설정될 때까지 대기 (최대 5초)
          let session = null;
          let attempts = 0;
          const maxAttempts = 10; // 0.5초씩 10번 시도 = 5초

          while (!session && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기

            try {
              const {
                data: { session: currentSession },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError) {
                console.error("세션 확인 오류:", sessionError);
                throw new Error("세션 확인 중 오류가 발생했습니다.");
              }

              if (currentSession) {
                session = currentSession;
                break;
              }
            } catch (error) {
              console.error("세션 확인 중 예외 발생:", error);
              // 계속 시도
            }

            attempts++;
          }

          if (!session?.user) {
            throw new Error(
              "사용자 세션이 없습니다. OAuth 인증이 완료되지 않았습니다."
            );
          }

          // OAuth Provider 확인 (구글 또는 GitHub)
          // URL에서 provider 정보를 추출하여 정확한 provider 확인
          const urlParams = new URLSearchParams(window.location.search);
          const urlProvider = urlParams.get("provider");

          // session의 provider와 URL의 provider를 비교하여 정확한 provider 결정
          let authProvider = session.user.app_metadata?.provider;

          // URL에 provider 정보가 있으면 그것을 우선 사용
          if (
            urlProvider &&
            (urlProvider === "google" || urlProvider === "github")
          ) {
            authProvider = urlProvider;
          }

          // session의 providers 배열에서 현재 활성화된 provider 확인
          const providers = session.user.app_metadata?.providers || [];
          if (providers.length > 0 && !urlProvider) {
            // providers 배열의 마지막 항목이 최근 로그인한 provider일 가능성이 높음
            authProvider = providers[providers.length - 1];
          }

          // User Metadata에서 provider 정보 확인 (GitHub의 경우 iss 필드로 구분)
          const userMetadata = session.user.user_metadata;
          if (userMetadata?.iss === "https://api.github.com" && !urlProvider) {
            authProvider = "github";
          } else if (
            userMetadata?.picture?.includes("googleusercontent.com") &&
            !urlProvider
          ) {
            authProvider = "google";
          }

          setProvider(authProvider || null);

          // OAuth 사용자 데이터 직접 처리
          if (authProvider) {
            try {
              await handleOAuthUserData(session.user, authProvider);
            } catch (error) {
              throw error;
            }
          } else {
            throw new Error("인증 제공자를 확인할 수 없습니다.");
          }

          // 새로운 사용자가 생성되었을 가능성이 있으므로 잠시 대기 후 사용자 데이터 처리
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

          // 현재 로그인한 사용자의 데이터베이스 정보 가져오기
          const { data: currentUser, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email)
            .eq("provider", authProvider)
            .single();

          if (userError) {
            throw new Error("사용자 데이터를 가져올 수 없습니다.");
          }

          if (!currentUser) {
            throw new Error("사용자 데이터가 없습니다. 다시 로그인해주세요.");
          }

          // 사용자 데이터를 Zustand store에 설정
          setUser(currentUser);

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
  }, [router, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {provider === "google"
              ? "구글 로그인 처리 중..."
              : provider === "github"
              ? "GitHub 로그인 처리 중..."
              : "로그인 처리 중..."}
          </h2>
          {provider === "github" && (
            <p className="text-gray-500 text-sm mb-2">
              GitHub 계정 정보를 확인하고 있습니다...
            </p>
          )}
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
            {provider === "google"
              ? "구글 로그인 실패"
              : provider === "github"
              ? "GitHub 로그인 실패"
              : "로그인 실패"}
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
