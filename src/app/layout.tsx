import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* 전체 레이아웃: header + scrollable main + nav */}
        <div className="flex flex-col h-screen overflow-hidden">
          {/* 고정 헤더 */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <Header />
          </div>

          {/* 스크롤 가능한 메인 콘텐츠 */}
          <main
            className="flex-1 overflow-y-auto custom-scroll "
            style={{
              height: "calc(100vh - 64px - 60px)", // header: 64px, nav: 60px
              marginTop: "64px",
              marginBottom: "60px",
            }}
          >
            {children}
          </main>

          {/* 고정 네비게이션 */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Navigation />
          </div>
        </div>
      </body>
    </html>
  );
}
