"use client";

import { useState } from "react";
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
        // users 테이블에서 사용자 정보 가져오기
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (userError) {
          console.error("사용자 데이터 조회 실패:", userError);
          setError("사용자 데이터 조회 중 오류가 발생했습니다.");
          return;
        }

        if (userData) {
          setEmail("");
          setPassword("");
          setIsRedirecting(true);

          // Zustand에 사용자 저장
          await getUserData();

          // 잠시 후 메인 페이지로 이동 (자연스러운 전환을 위해)
          setTimeout(() => {
            router.push("/");
          }, 300);
        }
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
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
