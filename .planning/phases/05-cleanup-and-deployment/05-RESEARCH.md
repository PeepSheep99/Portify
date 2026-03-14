# Phase 5: Code Cleanup & Deployment - Research

**Researched:** 2026-03-14
**Domain:** Code cleanup, linting, testing, Vercel deployment
**Confidence:** HIGH

## Summary

This phase focuses on cleaning up code accumulated over 4 phases of rapid development and deploying the application to Vercel production. The codebase currently has 11 ESLint issues (1 error, 10 warnings), 13 failing frontend tests (due to UI text changes not reflected in tests), and test dependencies in requirements.txt that should be excluded from production deployment.

The primary challenges are: (1) fixing the MusicVisualizer impure function error which violates React's purity rules, (2) removing unused imports across multiple files, (3) updating tests to match current UI text, and (4) configuring Vercel properly for Python serverless functions with the 500MB bundle limit in mind.

**Primary recommendation:** Fix ESLint issues with `eslint-plugin-unused-imports` for autofix, update test assertions to match actual UI, configure vercel.json to exclude test files and dev dependencies, then deploy with proper environment variables.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ESLint | ^9 | Code linting | Already configured with Next.js preset |
| eslint-plugin-unused-imports | ^4.x | Autofix unused imports | Provides --fix capability for unused imports |
| Vitest | ^4.1.0 | Frontend testing | Already in project |
| Pytest | ^8.0.0 | Python testing | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vercel CLI | latest | Local deployment testing | Use `vercel env pull` for env vars |

## Architecture Patterns

### Current Project Structure
```
.
├── api/                    # Python serverless functions
│   ├── index.py           # FastAPI app (main entry)
│   ├── youtube_music.py   # YouTube API integration
│   ├── track_matcher.py   # Track matching logic
│   ├── transfer.py        # Transfer utilities
│   └── tests/             # Python tests (EXCLUDE from bundle)
├── src/
│   ├── app/               # Next.js app directory
│   │   └── api/           # Next.js API routes (OAuth)
│   ├── components/        # React components
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript type definitions
├── requirements.txt       # Python deps (needs cleanup)
└── vercel.json           # Vercel config (needs update)
```

### Pattern 1: Production Requirements Split

**What:** Separate test dependencies from production
**When to use:** When deploying Python to Vercel (500MB limit)
**Example:**

```python
# requirements.txt (production only)
fastapi>=0.117.0
ytmusicapi>=1.11.0
python-dotenv>=1.0.0
rapidfuzz>=3.0.0
unidecode>=1.3.0

# requirements-dev.txt (development only)
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

### Pattern 2: Vercel excludeFiles for Python

**What:** Exclude test files from serverless bundle
**When to use:** All Python serverless deployments
**Example:**

```json
{
  "functions": {
    "api/**/*.py": {
      "excludeFiles": "{tests/**,__tests__/**,**/*.test.py,**/test_*.py,__pycache__/**,*.pyc}"
    }
  }
}
```

### Anti-Patterns to Avoid

- **Including test deps in production:** Bloats bundle, may exceed 500MB limit
- **Using Math.random() in useMemo:** Violates React purity rules, causes hydration errors
- **Leaving console.log in production:** Should be warnings-only (error boundaries acceptable)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unused imports removal | Manual find/delete | `eslint --fix` with eslint-plugin-unused-imports | Handles all files consistently |
| Dead code detection | Manual review | ESLint `no-unused-vars` | Already configured |
| Environment variable management | Custom scripts | `vercel env pull` | Syncs with Vercel dashboard |

## Common Pitfalls

### Pitfall 1: React Impurity with Math.random()

**What goes wrong:** ESLint error "Cannot call impure function during render"
**Why it happens:** `Math.random()` in `useMemo` violates React's purity requirement
**How to avoid:** Use `useState` with lazy initializer instead of `useMemo`
**Warning signs:** Error in `react-hooks/purity` rule

```tsx
// BAD - triggers purity error
const bars = useMemo(() => {
  return Array.from({ length: config.bars }, (_, i) => ({
    duration: 0.4 + Math.random() * 0.6,  // IMPURE!
  }));
}, [config.bars]);

// GOOD - useState lazy initializer runs once
const [bars] = useState(() =>
  Array.from({ length: config.bars }, (_, i) => ({
    duration: 0.4 + Math.random() * 0.6,
  }))
);
```

### Pitfall 2: Test Assertions Out of Sync with UI

**What goes wrong:** Tests fail looking for old UI text
**Why it happens:** Rapid UI iterations without test updates
**How to avoid:** Update tests when changing user-visible text
**Warning signs:** "Unable to find an element with the text" errors

### Pitfall 3: Vercel Python Bundle Size

**What goes wrong:** Deployment fails with "bundle size exceeds 500MB"
**Why it happens:** Including test files, __pycache__, dev dependencies
**How to avoid:** Configure `excludeFiles` in vercel.json, split requirements
**Warning signs:** Slow builds, deployment failures

### Pitfall 4: Missing Environment Variables in Production

**What goes wrong:** OAuth fails, "Missing Google OAuth credentials"
**Why it happens:** Environment variables not set in Vercel dashboard
**How to avoid:** Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Production environment
**Warning signs:** 500 errors on auth endpoints

## Code Examples

### Fix MusicVisualizer Impurity

```tsx
// Source: https://react.dev/reference/rules/components-and-hooks-must-be-pure

// BEFORE (causes ESLint error)
const bars = useMemo(() => {
  return Array.from({ length: config.bars }, (_, i) => ({
    id: i,
    duration: 0.4 + Math.random() * 0.6,
    delay: i * 0.1,
  }));
}, [config.bars]);

// AFTER (compliant with purity rules)
const [bars] = useState(() =>
  Array.from({ length: config.bars }, (_, i) => ({
    id: i,
    duration: 0.4 + Math.random() * 0.6,
    delay: i * 0.1,
  }))
);
```

### ESLint Flat Config with unused-imports

```javascript
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
```

### Vercel Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/**/*.py": {
      "excludeFiles": "{tests/**,__pycache__/**,*.pyc,conftest.py,**/test_*.py}"
    }
  }
}
```

### Environment Variables Required

| Variable | Scope | Description |
|----------|-------|-------------|
| GOOGLE_CLIENT_ID | Production, Preview, Development | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Production, Preview, Development | Google OAuth client secret |

## Current Issues Inventory

### ESLint Issues (from `npm run lint`)

| File | Issue | Type | Fix |
|------|-------|------|-----|
| src/app/api/youtube/auth/start/route.ts:36 | 'error' defined but never used | warning | Remove or prefix with _ |
| src/app/page.tsx:3 | 'useCallback' defined but never used | warning | Remove import |
| src/components/TransferProgress.test.tsx:1 | 'vi' defined but never used | warning | Remove import |
| src/components/TransferProgress.tsx:4 | 'CheckCircle' defined but never used | warning | Remove import |
| src/components/YouTubeAuthButton.test.tsx:1-2 | Multiple unused imports | warning | Remove imports |
| src/lib/spotifyParser.test.ts:10 | 'ParsedPlaylist' defined but never used | warning | Remove import |
| src/components/ui/MusicVisualizer.tsx:40 | Math.random() impure function | error | Use useState instead of useMemo |

### Failing Tests (from `npm run test:run`)

| Test File | Failures | Root Cause |
|-----------|----------|------------|
| FileDropzone.test.tsx | 1 | UI text changed from "Drag and drop..." to "Upload your Spotify data export" |
| TransferResults.test.tsx | 12 | Multiple UI text/class mismatches |

### Unused Components

| Component | Location | Status |
|-----------|----------|--------|
| AnimatedBackground | src/components/ui/AnimatedBackground.tsx | Not exported in index.ts, not imported elsewhere |
| MusicVisualizer | src/components/ui/MusicVisualizer.tsx | Not exported in index.ts, not imported elsewhere |

### Python Dependencies to Clean

```
# Current requirements.txt includes test deps:
pytest>=8.0.0          # DEV ONLY - remove from production
pytest-asyncio>=0.23.0 # DEV ONLY - remove from production
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint legacy config | ESLint flat config (ESLint 9) | 2024 | New config format required |
| --legacy-peer-deps | Native React 19 support | 2025 | react-dropzone now compatible |
| requirements.txt only | pyproject.toml with uv.lock | 2025 | Better dependency management |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (Frontend) | Vitest 4.1.0 |
| Framework (Backend) | Pytest 8.0.0 |
| Config file (Frontend) | vitest.config.mts |
| Config file (Backend) | pytest.ini (implicit) |
| Quick run command (Frontend) | `npm run test:run` |
| Quick run command (Backend) | `source venv/Scripts/activate && python -m pytest api/tests -v --tb=short` |

### Phase Requirements -> Test Map

| Area | Behavior | Test Type | Automated Command | Status |
|------|----------|-----------|-------------------|--------|
| ESLint | No errors/warnings | lint | `npm run lint` | 11 issues |
| Frontend Tests | All pass | unit | `npm run test:run` | 13 failing |
| Backend Tests | All pass | unit | `pytest api/tests` | 60 passing |
| Build | Succeeds | integration | `npm run build` | Not tested |
| Deploy | Works on Vercel | e2e | Manual verification | Pending |

### Wave 0 Gaps

- [x] Test infrastructure exists
- [ ] Fix FileDropzone.test.tsx UI text assertions
- [ ] Fix TransferResults.test.tsx UI text/class assertions
- [ ] Remove unused test imports

## Sources

### Primary (HIGH confidence)

- [Vercel Python Runtime Docs](https://vercel.com/docs/functions/runtimes/python) - Bundle limits, excludeFiles configuration
- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables) - Environment scopes, setting credentials
- [React Purity Rules](https://react.dev/reference/rules/components-and-hooks-must-be-pure) - Why Math.random() fails in useMemo

### Secondary (MEDIUM confidence)

- [eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports) - Autofix configuration
- [shadcn/ui Math.random issue](https://github.com/shadcn-ui/ui/issues/8540) - Known pattern for fixing impurity

### Project Artifacts

- `npm run lint` output - 11 issues captured
- `npm run test:run` output - 13 failures captured
- `pytest api/tests` output - 60 passing tests

## Metadata

**Confidence breakdown:**
- Code cleanup approach: HIGH - ESLint autofix is well-documented
- Test fixes: HIGH - Clear mapping between UI text and test assertions
- Vercel deployment: HIGH - Official docs cover Python functions
- Environment variables: HIGH - Standard Vercel pattern

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable deployment patterns)
