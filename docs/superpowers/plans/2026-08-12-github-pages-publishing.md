# GitHub Pages Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the complete six-model site at `https://meiosis7.github.io/biology-interactive-models/` through GitHub Pages.

**Architecture:** Keep the current Vinext/Sites build unchanged and add a separate Next.js static-export path used only by GitHub Pages. The Pages workflow builds under the repository base path, uploads the generated `out/` directory, and deploys it through GitHub's official Pages actions.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Vitest, GitHub Actions, GitHub Pages.

## Global Constraints

- The public Pages URL is exactly `https://meiosis7.github.io/biology-interactive-models/`.
- The existing Sites deployment remains available and unchanged.
- All six `/models/*` routes must support direct navigation and refresh.
- Existing local development and `npm run build` behavior must remain unchanged.
- `main` updates must automatically redeploy GitHub Pages.

---

### Task 1: Static-export configuration

**Files:**
- Modify: `next.config.ts`
- Modify: `app/layout.tsx`
- Modify: `package.json`
- Test: `tests/github-pages.test.ts`

**Interfaces:**
- Consumes: environment variable `GITHUB_PAGES=true`.
- Produces: `npm run build:pages`, generating the deployable `out/` directory with `/biology-interactive-models` as the base path.

- [ ] **Step 1: Write failing configuration tests**

Add tests that require `next.config.ts` to enable `output: "export"`, `trailingSlash`, `basePath`, and `assetPrefix` only when `GITHUB_PAGES=true`; require `package.json` to expose `build:pages`; and require `app/layout.tsx` to avoid request-time `headers()`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- tests/github-pages.test.ts`

Expected: failures identify the missing static-export configuration and request-dependent metadata.

- [ ] **Step 3: Implement the minimal Pages build path**

Use this configuration shape in `next.config.ts`:

```ts
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = "/biology-interactive-models";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      trailingSlash: true,
      basePath: repositoryBasePath,
      assetPrefix: repositoryBasePath,
      images: { unoptimized: true },
    }
  : {};
```

Replace request-time metadata generation with static `metadata` and use `metadataBase: new URL("https://meiosis7.github.io/biology-interactive-models/")`. Add `"build:pages": "GITHUB_PAGES=true next build"` to `package.json`.

- [ ] **Step 4: Run focused tests and static export**

Run: `npm test -- tests/github-pages.test.ts && npm run build:pages`

Expected: tests pass; `out/index.html` and all six `out/models/<slug>/index.html` files exist.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts app/layout.tsx package.json tests/github-pages.test.ts
git commit -m "feat: add GitHub Pages static export"
```

### Task 2: Automatic Pages deployment workflow

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`
- Test: `tests/github-pages.test.ts`

**Interfaces:**
- Consumes: the `build:pages` script from Task 1 and GitHub's Pages environment.
- Produces: an artifact from `out/` deployed to GitHub Pages on every push to `main`.

- [ ] **Step 1: Add failing workflow contract tests**

Require the workflow to trigger on `main`, grant `pages: write` and `id-token: write`, use Node 22, run `npm ci`, run the existing test/lint checks plus `npm run build:pages`, upload `out`, and deploy with `actions/deploy-pages`.

- [ ] **Step 2: Run focused test and confirm RED**

Run: `npm test -- tests/github-pages.test.ts`

Expected: failure reports the missing `.github/workflows/pages.yml`.

- [ ] **Step 3: Add the workflow and user-facing link**

Create a two-job workflow (`build`, then `deploy`) using the official GitHub Pages actions. Add the Pages URL near the top of `README.md` and retain the existing local/Sites instructions.

- [ ] **Step 4: Run focused checks**

Run: `npm test -- tests/github-pages.test.ts && npm run lint`

Expected: all focused tests and lint pass.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pages.yml README.md tests/github-pages.test.ts
git commit -m "ci: publish site with GitHub Pages"
```

### Task 3: Validate and publish

**Files:**
- Verify only: generated `out/` artifact and GitHub Pages deployment.

**Interfaces:**
- Consumes: Tasks 1 and 2, GitHub repository `Meiosis7/biology-interactive-models`.
- Produces: the live public site and deployment evidence.

- [ ] **Step 1: Run the complete local validation chain**

Run: `npm test && npm run lint && npm run build && npm run build:pages && git diff --check`

Expected: all commands exit 0; all seven HTML entry points exist under `out/`.

- [ ] **Step 2: Push the validated commit to `main`**

Run: `git push origin HEAD:main`

Expected: GitHub accepts the update and starts the Pages workflow.

- [ ] **Step 3: Configure Pages for GitHub Actions if needed**

Inspect `gh api repos/Meiosis7/biology-interactive-models/pages`. If Pages is absent, create it with `build_type: workflow`; otherwise update its build type without changing visibility.

- [ ] **Step 4: Wait for deployment success**

Use the GitHub workflow status until the Pages deployment finishes successfully. If it fails, inspect only the failing job logs, fix the verified cause, and rerun validation before pushing.

- [ ] **Step 5: Browser acceptance**

Open the Pages homepage and all six direct model URLs. Confirm asset requests have no 404s, the action-potential controls work, page refresh succeeds, and desktop/mobile layouts have no horizontal overflow.

- [ ] **Step 6: Hand off the live URL**

Return `https://meiosis7.github.io/biology-interactive-models/` as the primary result and the action-potential direct URL as a secondary link.
