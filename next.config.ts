import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일/타기기에서 접속 시 IP도 허용
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.219.199",
    "192.168.0.0/16",   // 사설망 전체 허용
    "10.0.0.0/8",
  ],
};

export default nextConfig;
