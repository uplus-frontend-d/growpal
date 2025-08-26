"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      setError("비밀번호는 8자리 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      // API를 통한 회원가입
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 탈퇴한 계정의 재가입 시도인 경우
        if (response.status === 403 && data.code === "DELETED_ACCOUNT") {
          setError(data.error);
        }
        // 이미 가입된 이메일인 경우 provider 정보 포함 에러 메시지 표시
        else if (response.status === 409 && data.provider) {
          setError(data.error);
        } else {
          setError(data.error || "회원가입 중 오류가 발생했습니다.");
        }
        return;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("회원가입 오류:", error);
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            회원가입 완료!
          </h2>
          <p className="text-gray-800 text-base mb-4">
            이메일 주소로 확인 링크를 보내드렸습니다.
          </p>
          <p className="text-gray-800 text-base mb-4">
            이메일을 확인하고 계정을 활성화해주세요.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            다시 가입하기
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

        <div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-gray-900 bg-white"
            placeholder="Password (8자리 이상)"
            required
          />
        </div>

        <div>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-gray-900 bg-white"
            placeholder="Confirm Password"
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
          {loading ? "가입 중..." : "Sign Up"}
        </button>
      </form>

      <div className="text-center">
        <p className="text-base text-gray-800">
          이미 계정이 있으신가요?{" "}
          <a
            href="/login"
            className="text-blue-700 hover:text-blue-900 font-semibold"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
