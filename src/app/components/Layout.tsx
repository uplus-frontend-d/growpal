"use client";

import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className=" bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="pb-24">{children}</main>
    </div>
  );
}
