
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "172.16.0.2",
    "localhost",
  ],
};

export default nextConfig;
