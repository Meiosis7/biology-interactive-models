import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      trailingSlash: true,
      basePath: "/biology-interactive-models",
      assetPrefix: "/biology-interactive-models",
      images: { unoptimized: true },
      typescript: { tsconfigPath: "tsconfig.pages.json" },
    }
  : {};

export default nextConfig;
