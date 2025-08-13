import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true }, // ESLint 에러로 빌드 실패하지 않음
  typescript: { ignoreBuildErrors: true }, // TS 에러로 빌드 실패하지 않음
};

export default nextConfig;
