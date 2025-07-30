"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. users 테이블에서 해당 이메일이 존재하는지 확인
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();

      if (userError) {
        if (userError.code === "PGRST116") {
          // 데이터가 없는 경우 (PGRST116: No rows returned)
          setError(
            "등록되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요."
          );
        } else {
          console.error("사용자 조회 오류:", userError);
          setError("사용자 정보 조회 중 오류가 발생했습니다.");
        }
        return;
      }

      if (!userData) {
        setError(
          "등록되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요."
        );
        return;
      }

      // 2. 유효한 사용자인 경우에만 비밀번호 재설정 이메일 전송
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        console.error("비밀번호 재설정 이메일 전송 오류:", resetError);
        setError(resetError.message);
      } else {
        setSuccess(true);
        setEmail("");
      }
    } catch (error) {
      console.error("비밀번호 재설정 처리 오류:", error);
      setError("비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-3">
            이메일 전송 완료!
          </h2>
          <p className="text-gray-800 text-base mb-3">
            비밀번호 재설정 링크를 이메일로 보내드렸습니다.
          </p>
          <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
            <p className="text-green-800 text-sm font-medium">
              이메일을 확인하고 비밀번호를 재설정해주세요.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="bg-gray-100 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm inline-block"
          >
            다시 시도하기
          </button>
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
          {loading ? "전송 중..." : "비밀번호 재설정 이메일 보내기"}
        </button>
      </form>

      <div className="text-center">
        <p className="text-base text-gray-800">
          비밀번호를 기억하셨나요?{" "}
          <a
            href="/login"
            className="text-blue-700 hover:text-blue-900 font-semibold"
          >
            로그인하기
          </a>
        </p>
      </div>
    </div>
  );
}
