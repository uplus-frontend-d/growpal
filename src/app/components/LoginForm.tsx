"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useUserData } from "../lib/useUserData";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const router = useRouter();
  const { getUserData } = useUserData();

  // getUserData를 안전하게 호출하기 위한 콜백
  const safeGetUserData = useCallback(async () => {
    try {
      await getUserData();
    } catch (error) {
      // 에러는 조용히 무시
    }
  }, [getUserData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        try {
          // users 테이블에서 사용자 정보 가져오기
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          if (userError) {
            // 사용자가 users 테이블에 없는 경우 새로 생성
            if (userError.code === "PGRST116") {
              // 완전히 새로운 사용자인 경우 생성
              const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                  id: authData.user.id,
                  email: authData.user.email,
                  created_at: new Date().toISOString(),
                  provider: authData.user.app_metadata?.provider || "email",
                })
                .select()
                .single();

              if (insertError) {
                setError("사용자 계정 생성 중 오류가 발생했습니다.");
                return;
              }

              setEmail("");
              setPassword("");
              setIsRedirecting(true);

              // Zustand에 사용자 저장
              await safeGetUserData();

              // 잠시 후 메인 페이지로 이동
              setTimeout(() => {
                router.push("/");
              }, 300);
            } else {
              setError("사용자 데이터 조회 중 오류가 발생했습니다.");
            }
            return;
          }

          if (userData) {
            setEmail("");
            setPassword("");
            setIsRedirecting(true);

            // Zustand에 사용자 저장
            await safeGetUserData();

            // 잠시 후 메인 페이지로 이동 (자연스러운 전환을 위해)
            setTimeout(() => {
              router.push("/");
            }, 300);
          }
        } catch (error) {
          setError("사용자 데이터 처리 중 오류가 발생했습니다.");
        }
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 타임아웃 설정 (15초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("로그인 요청 시간이 초과되었습니다.")),
          15000
        );
      });

      const loginPromise = async () => {
        // Supabase 클라이언트에서 직접 OAuth 로그인 시작
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?provider=google`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          // 구체적인 에러 메시지 처리
          if (error.message?.includes("popup")) {
            throw new Error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
          } else if (error.message?.includes("network")) {
            throw new Error("네트워크 연결을 확인해주세요.");
          } else if (error.message?.includes("cancelled")) {
            throw new Error("로그인이 취소되었습니다.");
          } else {
            throw new Error("구글 로그인 중 오류가 발생했습니다.");
          }
        }

        if (!data.url) {
          throw new Error("로그인 URL을 생성할 수 없습니다.");
        }

        // 구글 로그인 페이지로 리다이렉트
        window.location.href = data.url;
      };

      // 타임아웃과 함께 실행
      await Promise.race([loginPromise(), timeoutPromise]);
    } catch (error: any) {
      // 네트워크 오류 처리
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("network")
      ) {
        setError("네트워크 연결을 확인해주세요.");
      } else if (error.message?.includes("시간이 초과")) {
        setError("로그인 요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError(error.message || "구글 로그인 중 오류가 발생했습니다.");
      }
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 타임아웃 설정 (15초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("로그인 요청 시간이 초과되었습니다.")),
          15000
        );
      });

      const loginPromise = async () => {
        // Supabase 클라이언트에서 직접 OAuth 로그인 시작
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?provider=github`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          // 구체적인 에러 메시지 처리
          if (error.message?.includes("popup")) {
            throw new Error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
          } else if (error.message?.includes("network")) {
            throw new Error("네트워크 연결을 확인해주세요.");
          } else if (error.message?.includes("cancelled")) {
            throw new Error("로그인이 취소되었습니다.");
          } else {
            throw new Error("GitHub 로그인 중 오류가 발생했습니다.");
          }
        }

        if (!data.url) {
          throw new Error("로그인 URL을 생성할 수 없습니다.");
        }

        // GitHub 로그인 페이지로 리다이렉트
        window.location.href = data.url;
      };

      // 타임아웃과 함께 실행
      await Promise.race([loginPromise(), timeoutPromise]);
    } catch (error: any) {
      // 네트워크 오류 처리
      if (
        error.message?.includes("fetch") ||
        error.message?.includes("network")
      ) {
        setError("네트워크 연결을 확인해주세요.");
      } else if (error.message?.includes("시간이 초과")) {
        setError("로그인 요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError(error.message || "GitHub 로그인 중 오류가 발생했습니다.");
      }
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            로그인 성공!
          </h2>
          <p className="text-gray-600 text-sm">메인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-gray-900 bg-white"
            placeholder="Email"
            required
          />
        </div>

        <div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-gray-900 bg-white"
            placeholder="Password"
            required
          />
        </div>

        {error && (
          <div className="text-red-800 text-base font-medium bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-3 px-4 rounded-lg hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-base"
        >
          {loading ? "로그인 중..." : "Login"}
        </button>
      </form>

      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">또는</span>
        </div>
      </div>

      {/* 구글 로그인 버튼 */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-semibold text-base flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>{loading ? "처리 중..." : "Google로 로그인"}</span>
      </button>

      {/* GitHub 로그인 버튼 */}
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={loading}
        className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold text-base flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span>{loading ? "처리 중..." : "GitHub로 로그인"}</span>
      </button>

      <div className="flex justify-between items-center">
        <a
          href="/signup"
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
        >
          Sign Up
        </a>
        <a
          href="/forgot-password"
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
        >
          Forgot Password
        </a>
      </div>
    </div>
  );
}
