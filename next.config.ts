import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Đánh dấu @ffmpeg-installer/ffmpeg là external module
      config.externals = [...(config.externals || []), "@ffmpeg-installer/ffmpeg"];
    }
    return config;
  },
};

export default nextConfig;
