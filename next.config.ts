import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitInfo() {
  try {
    const hash = execSync("git rev-parse --short HEAD").toString().trim();
    const date = execSync("git log -1 --format=%ci").toString().trim().slice(0, 10);
    return { hash, date };
  } catch {
    return { hash: "dev", date: new Date().toISOString().slice(0, 10) };
  }
}

const { hash, date } = getGitInfo();

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  env: {
    NEXT_PUBLIC_GIT_HASH: hash,
    NEXT_PUBLIC_BUILD_DATE: date,
  },
};

export default nextConfig;
