"use client";

import { useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText === "탈퇴") {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 회원 탈퇴</h2>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">주의사항</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 모든 식물 데이터가 영구적으로 삭제됩니다</li>
              <li>• 모든 일기와 할 일 데이터가 삭제됩니다</li>
              <li>• 계정 복구는 불가능합니다</li>
              <li>• 이 작업은 되돌릴 수 없습니다</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              확인을 위해 <span className="font-bold text-red-600">"탈퇴"</span>
              를 입력해주세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="탈퇴"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmText !== "탈퇴" || isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "처리 중..." : "회원 탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}
