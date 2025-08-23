"use client";

import { ReactNode } from "react";
import { useNotificationCheck } from "../hooks/useNotificationCheck";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  // 알림 체크 훅 사용
  useNotificationCheck();

  return (
    <div className=" bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="pb-24">{children}</main>
    </div>
  );
}
