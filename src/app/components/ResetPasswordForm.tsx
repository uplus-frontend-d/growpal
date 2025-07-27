"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // 세션 유효성 확인
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError(
          "유효하지 않은 세션입니다. 비밀번호 찾기를 다시 시도해주세요."
        );
        return;
      }
      setIsValidSession(true);
    };

    checkSession();
  }, []);

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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      setError("비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-3">세션 오류</h2>
          <p className="text-gray-800 text-base mb-4">{error}</p>
          <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-4">
            <p className="text-red-800 text-sm font-medium">
              비밀번호 찾기를 다시 시도해주세요
            </p>
          </div>
          <a
            href="/forgot-password"
            className="bg-gray-100 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm inline-block"
          >
            비밀번호 찾기로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-3">
            비밀번호 변경 완료!
          </h2>
          <p className="text-gray-800 text-base mb-3">
            비밀번호가 성공적으로 변경되었습니다.
          </p>
          <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
            <p className="text-green-800 text-sm font-medium">
              3초 후 로그인 페이지로 이동합니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-gray-900 bg-white"
            placeholder="새 비밀번호 (8자리 이상)"
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
            placeholder="새 비밀번호 확인"
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
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      <div className="text-center">
        <p className="text-base text-gray-800">
          <a
            href="/login"
            className="text-blue-700 hover:text-blue-900 font-semibold"
          >
            로그인 페이지로 돌아가기
          </a>
        </p>
      </div>
    </div>
  );
}
