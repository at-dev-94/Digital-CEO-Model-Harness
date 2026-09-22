import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  turbopack: {
    // Stop Next picking C:\Users as the workspace root (stray lockfile there).
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
