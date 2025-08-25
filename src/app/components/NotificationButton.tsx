"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  send_at: string;
  plant_id: string;
  plants: {
    id: string;
    name: string;
  };
}

export default function NotificationButton() {
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"right" | "left">(
    "right"
  );

  // 알림 조회
  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("알림 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 확인 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sent: true }),
      });

      if (response.ok) {
        // 확인된 알림 제거
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error("알림 확인 처리 오류:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // 사용자가 없으면 컴포넌트를 렌더링하지 않음
  if (!user) {
    return null;
  }

  // 드롭다운 위치 결정 함수
  const handleToggleDropdown = () => {
    if (!isOpen) {
      // 드롭다운을 열 때 화면 크기 확인
      const buttonRect = document
        .querySelector("[data-notification-button]")
        ?.getBoundingClientRect();
      if (buttonRect) {
        const screenWidth = window.innerWidth;
        const dropdownWidth = 384; // w-96 = 24rem = 384px
        const rightSpace = screenWidth - buttonRect.right;

        if (rightSpace < dropdownWidth) {
          setDropdownPosition("left");
        } else {
          setDropdownPosition("right");
        }
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* 알림 버튼 */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="알림"
        data-notification-button
      >
        <Bell className="w-6 h-6" />
        {/* 알림 개수 표시 */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* 알림 리스트 */}
      {isOpen && (
        <div
          className={`absolute top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto ${
            dropdownPosition === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">알림</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1 break-words leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {notification.plants?.name &&
                          `${notification.plants.name} • `}
                        {new Date(notification.send_at).toLocaleDateString(
                          "ko-KR"
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 whitespace-nowrap"
                      >
                        확인
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                새로운 알림이 없습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
