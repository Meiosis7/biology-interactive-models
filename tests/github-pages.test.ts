import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("GitHub Pages publishing", () => {
  it("provides an isolated static export for the repository base path", () => {
    const nextConfig = readFileSync("next.config.ts", "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(nextConfig).toContain('process.env.GITHUB_PAGES === "true"');
    expect(nextConfig).toContain('output: "export"');
    expect(nextConfig).toContain("trailingSlash: true");
    expect(nextConfig).toContain('basePath: "/biology-interactive-models"');
    expect(nextConfig).toContain('assetPrefix: "/biology-interactive-models"');
    expect(nextConfig).toContain("images: { unoptimized: true }");
    expect(nextConfig).toContain('tsconfigPath: "tsconfig.pages.json"');
    expect(packageJson.scripts["build:pages"]).toBe(
      "GITHUB_PAGES=true next build",
    );
  });

  it("keeps Cloudflare-only examples outside the Pages type-check boundary", () => {
    const pagesTsconfig = JSON.parse(
      readFileSync("tsconfig.pages.json", "utf8"),
    ) as { include: string[]; exclude: string[] };

    expect(pagesTsconfig.include).toEqual(
      expect.arrayContaining(["app/**/*.ts", "components/**/*.tsx", "models/**/*.tsx"]),
    );
    expect(pagesTsconfig.exclude).toEqual(
      expect.arrayContaining(["db", "worker", "examples", "build"]),
    );
  });

  it("uses metadata that can be generated without request headers", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");

    expect(layout).not.toContain('from "next/headers"');
    expect(layout).not.toContain("headers()");
    expect(layout).toContain("export const metadata");
    expect(layout).toContain(
      'new URL("https://meiosis7.github.io/biology-interactive-models/")',
    );
  });

  it("deploys the static export from main with GitHub's Pages actions", () => {
    const workflow = readFileSync(".github/workflows/pages.yml", "utf8");

    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("node-version: 22");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run build:pages");
    expect(workflow).toContain("actions/upload-pages-artifact@v4");
    expect(workflow).toContain("path: ./out");
    expect(workflow).toContain("actions/deploy-pages@v4");
  });

  it("links the public Pages website from the repository README", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain(
      "https://meiosis7.github.io/biology-interactive-models/",
    );
  });
});
