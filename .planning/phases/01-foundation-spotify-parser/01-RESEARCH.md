# Phase 1: Foundation + Spotify Parser - Research

**Researched:** 2026-03-13
**Domain:** Vercel deployment, Python serverless, Spotify GDPR JSON parsing, React file upload
**Confidence:** MEDIUM

## Summary

Phase 1 establishes the project foundation: a Next.js frontend on Vercel with Python serverless functions for backend processing, plus a Spotify JSON parser for GDPR export data.

Vercel supports Python serverless functions natively with zero configuration when using FastAPI. The recommended approach is a single FastAPI app in `api/index.py` that handles all backend routes. Spotify's GDPR export provides JSON files containing playlists (Playlist1.json) and liked songs (within YourLibrary.json) with track name, artist name, and album information. For drag-and-drop file upload, react-dropzone is the established standard, though it requires `--legacy-peer-deps` for React 19 / Next.js 15 compatibility.

**Primary recommendation:** Use Next.js 15 + FastAPI on Vercel with react-dropzone for file uploads and client-side JSON parsing (no need to upload to server for parsing).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEP-01 | App hosted on Vercel (free tier) | FastAPI on Vercel section - zero config deployment |
| DEP-02 | YouTube Music calls via Python serverless | FastAPI setup provides foundation; actual YTM integration in Phase 2 |
| SRC-01 | User can upload Spotify GDPR JSON export file | react-dropzone + HTML5 File API patterns |
| SRC-02 | User can see parsed playlists with track names | Spotify JSON Structure section documents format |
| SRC-03 | User can see parsed liked songs | YourLibrary.json contains tracks array with liked songs |
| UX-01 | User can drag-and-drop JSON file | react-dropzone provides drag-and-drop with TypeScript support |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | React framework | Vercel's native framework, optimal deployment |
| FastAPI | 0.117+ | Python API framework | Official Vercel support, async, type hints |
| react-dropzone | 14.3.x | File drag-and-drop | De facto standard, 10M+ weekly downloads |
| TypeScript | 5.x | Type safety | Next.js default, catches errors early |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x | Styling | Quick functional UI without custom CSS |
| Vitest | 3.x | Frontend testing | Fast, native ESM, works with Next.js 15 |
| pytest | 8.x | Python testing | Standard Python test framework |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FastAPI | BaseHTTPRequestHandler | FastAPI is cleaner, has auto-docs, minimal overhead |
| react-dropzone | Native HTML5 drag events | More boilerplate, no TypeScript types, no file validation |
| Vitest | Jest | Vitest is faster, simpler config with Vite/Next.js 15 |

**Installation:**
```bash
# Frontend (Next.js)
npx create-next-app@latest portify --typescript --tailwind --eslint --app --src-dir
cd portify
npm install react-dropzone --legacy-peer-deps

# Backend dependencies (requirements.txt)
fastapi>=0.117.0
```

## Architecture Patterns

### Recommended Project Structure

```
portify/
├── api/                      # Python serverless (Vercel)
│   └── index.py              # FastAPI app (health check for now)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page with file upload
│   │   └── globals.css       # Tailwind imports
│   ├── components/
│   │   ├── FileDropzone.tsx  # Drag-and-drop component
│   │   └── PlaylistList.tsx  # Display parsed playlists
│   ├── lib/
│   │   └── spotifyParser.ts  # JSON parsing logic
│   └── types/
│       └── spotify.ts        # TypeScript types for Spotify data
├── public/
├── requirements.txt          # Python dependencies
├── vercel.json               # Vercel config (optional)
├── vitest.config.mts         # Test configuration
└── package.json
```

### Pattern 1: Client-Side JSON Parsing

**What:** Parse Spotify JSON files entirely in the browser using FileReader API
**When to use:** Always for this app - no server needed for parsing JSON
**Why:** Faster, no upload wait, no server costs, privacy-friendly

```typescript
// Source: HTML5 FileReader API
const parseSpotifyFile = async (file: File): Promise<SpotifyData> => {
  const text = await file.text();
  const data = JSON.parse(text);
  return normalizeSpotifyData(data);
};
```

### Pattern 2: FastAPI Health Check Endpoint

**What:** Simple health endpoint to verify Python serverless works
**When to use:** Phase 1 foundation - real endpoints added in Phase 2

```python
# Source: Vercel FastAPI docs
# api/index.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/api")
def health():
    return {"status": "ok", "service": "portify"}
```

### Pattern 3: File Dropzone with Validation

**What:** Drag-and-drop zone that accepts only JSON files
**When to use:** For the file upload UI

```typescript
// Source: react-dropzone docs
'use client';
import { useDropzone } from 'react-dropzone';

export function FileDropzone({ onFileParsed }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/json': ['.json'] },
    maxFiles: 10, // Spotify may export multiple playlist files
    onDrop: async (files) => {
      for (const file of files) {
        const data = await parseSpotifyFile(file);
        onFileParsed(data);
      }
    },
  });

  return (
    <div {...getRootProps()} className={isDragActive ? 'border-blue-500' : ''}>
      <input {...getInputProps()} />
      {isDragActive ? 'Drop files here' : 'Drag Spotify JSON files here'}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Uploading JSON to server for parsing:** Wasteful - parse in browser instead
- **Single file assumption:** Spotify exports can have multiple files (Playlist1.json, YourLibrary.json, etc.)
- **Hardcoding Vercel config:** Zero-config is preferred; only add vercel.json if needed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom dragenter/dragover/drop handlers | react-dropzone | Handles edge cases, browser compat, accessibility |
| JSON validation | Manual field checking | TypeScript type guards + Zod | Type-safe, exhaustive checking |
| Python API framework | BaseHTTPRequestHandler | FastAPI | Cleaner, typed, auto-generated docs |
| File type validation | Extension string matching | MIME type checking via accept prop | More reliable, harder to spoof |

**Key insight:** Spotify GDPR export format is documented but varies slightly between export types. Build flexible parsing that handles missing fields gracefully.

## Common Pitfalls

### Pitfall 1: React 19 Compatibility with react-dropzone

**What goes wrong:** npm install fails with peer dependency errors
**Why it happens:** react-dropzone 14.x declares React 18 as peer dependency
**How to avoid:** Use `--legacy-peer-deps` flag: `npm install react-dropzone --legacy-peer-deps`
**Warning signs:** "ERESOLVE unable to resolve dependency tree" error

### Pitfall 2: Forgetting 'use client' Directive

**What goes wrong:** "useState is not defined" or "useDropzone is not a function"
**Why it happens:** Next.js 15 App Router defaults to Server Components
**How to avoid:** Add `'use client';` at top of components using React hooks or browser APIs
**Warning signs:** Runtime errors about hooks or browser APIs in server context

### Pitfall 3: Python Function Not Found

**What goes wrong:** 404 errors when calling /api endpoints
**Why it happens:** FastAPI app variable not named `app` or file not in correct location
**How to avoid:** Use exact file paths (api/index.py) and export `app = FastAPI()`
**Warning signs:** Works locally but 404 on Vercel, or vercel dev shows "No Python functions found"

### Pitfall 4: Assuming Consistent Spotify Export Structure

**What goes wrong:** Parser crashes on some user exports
**Why it happens:** Spotify export format varies: some have URI fields, some don't; some have albums, some don't
**How to avoid:** Use optional chaining, provide fallbacks, validate presence of required fields
**Warning signs:** TypeError: Cannot read property 'X' of undefined

### Pitfall 5: Large File Handling

**What goes wrong:** Browser freezes when parsing large Spotify libraries
**Why it happens:** Synchronous JSON.parse blocks main thread for large files (10MB+)
**How to avoid:** Use streaming parser or Web Worker for files over 5MB
**Warning signs:** UI becomes unresponsive during file processing

## Code Examples

### Spotify JSON Type Definitions

```typescript
// src/types/spotify.ts
// Source: Reverse-engineered from Spotify GDPR export samples

// YourLibrary.json structure
export interface SpotifyLibrary {
  tracks: SpotifyTrack[];
  albums?: SpotifyAlbum[];
  shows?: SpotifyShow[];
  episodes?: SpotifyEpisode[];
  bannedTracks?: SpotifyTrack[];
  other?: unknown;
}

export interface SpotifyTrack {
  artist: string;      // Artist name
  track: string;       // Track title
  album?: string;      // Album name (not always present)
  uri?: string;        // spotify:track:xxxxx (not always present)
}

// Playlist1.json structure
export interface SpotifyPlaylistExport {
  playlists: SpotifyPlaylist[];
}

export interface SpotifyPlaylist {
  name: string;
  lastModifiedDate?: string;
  items: SpotifyPlaylistItem[];
  description?: string;
  numberOfFollowers?: number;
}

export interface SpotifyPlaylistItem {
  track: {
    trackName: string;
    artistName: string;
    albumName: string;
    trackUri?: string;
  };
  episode?: {
    episodeName: string;
    showName: string;
  };
  localTrack?: {
    trackName: string;
    artistName: string;
    albumName: string;
  };
  addedDate?: string;
}

// Unified format for app usage
export interface ParsedPlaylist {
  name: string;
  tracks: ParsedTrack[];
  source: 'playlist' | 'liked_songs';
}

export interface ParsedTrack {
  name: string;
  artist: string;
  album: string | null;
}
```

### Spotify Parser Implementation

```typescript
// src/lib/spotifyParser.ts
import type {
  SpotifyLibrary,
  SpotifyPlaylistExport,
  ParsedPlaylist,
  ParsedTrack,
} from '@/types/spotify';

export function parseSpotifyLibrary(data: unknown): ParsedPlaylist | null {
  if (!isSpotifyLibrary(data)) return null;

  const tracks: ParsedTrack[] = data.tracks.map((t) => ({
    name: t.track,
    artist: t.artist,
    album: t.album ?? null,
  }));

  return {
    name: 'Liked Songs',
    tracks,
    source: 'liked_songs',
  };
}

export function parseSpotifyPlaylists(data: unknown): ParsedPlaylist[] {
  if (!isSpotifyPlaylistExport(data)) return [];

  return data.playlists.map((playlist) => ({
    name: playlist.name,
    source: 'playlist',
    tracks: playlist.items
      .filter((item) => item.track) // Skip episodes
      .map((item) => ({
        name: item.track.trackName,
        artist: item.track.artistName,
        album: item.track.albumName ?? null,
      })),
  }));
}

// Type guards
function isSpotifyLibrary(data: unknown): data is SpotifyLibrary {
  return (
    typeof data === 'object' &&
    data !== null &&
    'tracks' in data &&
    Array.isArray((data as SpotifyLibrary).tracks)
  );
}

function isSpotifyPlaylistExport(data: unknown): data is SpotifyPlaylistExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'playlists' in data &&
    Array.isArray((data as SpotifyPlaylistExport).playlists)
  );
}

// Detect file type and parse accordingly
export function parseSpotifyFile(jsonData: unknown, filename: string): ParsedPlaylist[] {
  // YourLibrary.json contains liked songs
  if (filename.toLowerCase().includes('yourlibrary')) {
    const library = parseSpotifyLibrary(jsonData);
    return library ? [library] : [];
  }

  // Playlist files
  if (filename.toLowerCase().includes('playlist')) {
    return parseSpotifyPlaylists(jsonData);
  }

  // Try both parsers as fallback
  const library = parseSpotifyLibrary(jsonData);
  if (library) return [library];

  const playlists = parseSpotifyPlaylists(jsonData);
  if (playlists.length > 0) return playlists;

  return [];
}
```

### FastAPI Health Check

```python
# api/index.py
# Source: Vercel FastAPI official docs
from fastapi import FastAPI

app = FastAPI(
    title="Portify API",
    description="Playlist migration service",
    version="0.1.0"
)

@app.get("/api")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "portify", "version": "0.1.0"}

@app.get("/api/hello")
def hello(name: str = "World"):
    """Test endpoint with query parameter"""
    return {"message": f"Hello, {name}!"}
```

### Vitest Configuration

```typescript
// vitest.config.mts
// Source: Next.js official Vitest guide (Feb 2026)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flask on Vercel | FastAPI on Vercel | 2025 | Zero-config, better async support |
| Jest for Next.js | Vitest for Next.js 15 | 2025 | Faster, simpler config |
| React 18 | React 19 + Next.js 15 | 2024 | New Server Components model |
| Pages Router | App Router (default) | 2023 | 'use client' needed for client components |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps`: Replaced by Server Components and `fetch` in App Router
- `@types/react-dropzone`: Types now included in react-dropzone package
- `vercel.json` routes: Not needed for standard Next.js + FastAPI setup

## Open Questions

1. **Exact Spotify GDPR JSON schema**
   - What we know: Files include YourLibrary.json (liked songs), Playlist1.json (playlists) with track/artist/album fields
   - What's unclear: Complete field list varies; some exports have URIs, some don't
   - Recommendation: Build flexible parser with optional fields; test with real export

2. **File size limits for browser parsing**
   - What we know: JSON.parse can handle several MB files
   - What's unclear: At what size does it become problematic on mobile?
   - Recommendation: Start simple; add Web Worker if users report issues with large libraries

3. **react-dropzone React 19 long-term support**
   - What we know: Works with `--legacy-peer-deps` flag
   - What's unclear: When will official React 19 support land
   - Recommendation: Use flag for now; monitor react-dropzone releases

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Testing Library |
| Config file | `vitest.config.mts` (see Wave 0) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEP-01 | App deploys to Vercel | smoke | Manual: `vercel --prod` then curl | N/A - deploy test |
| DEP-02 | Python serverless responds | integration | `curl http://localhost:3000/api` | Wave 0 |
| SRC-01 | User can upload Spotify JSON | e2e/manual | Manual drag-drop test | N/A - UI test |
| SRC-02 | Playlists parsed with track names | unit | `npm test -- spotifyParser.test.ts` | Wave 0 |
| SRC-03 | Liked songs parsed separately | unit | `npm test -- spotifyParser.test.ts` | Wave 0 |
| UX-01 | Drag-and-drop accepts JSON | unit | `npm test -- FileDropzone.test.tsx` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run` (quick single run)
- **Per wave merge:** `npm test` (full suite with watch disabled)
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps

- [ ] `vitest.config.mts` - Vitest configuration
- [ ] `vitest.setup.ts` - Testing Library setup
- [ ] `src/lib/spotifyParser.test.ts` - Parser unit tests for SRC-02, SRC-03
- [ ] `src/components/FileDropzone.test.tsx` - Dropzone component tests for UX-01
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths`

## Sources

### Primary (HIGH confidence)

- [Vercel Python Runtime Docs](https://vercel.com/docs/functions/runtimes/python) - File structure, handler patterns, Python versions, limitations
- [Vercel FastAPI Docs](https://vercel.com/docs/frameworks/backend/fastapi) - Zero-config setup, entrypoints, lifespan events
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) - Official test setup for Next.js 15

### Secondary (MEDIUM confidence)

- [react-dropzone npm](https://www.npmjs.com/package/react-dropzone) - Version 14.3.8, React 19 compatibility issue
- [Spotify GDPR Export Analysis](https://news.ycombinator.com/item?id=24764371) - Community discussion of export file structure
- [Spotify Understanding Your Data](https://support.spotify.com/us/article/understanding-your-data/) - Official description of export contents
- [GitHub exsp project](https://github.com/gk4m/exsp) - Example JSON structure for playlists with tracks

### Tertiary (LOW confidence)

- Spotify GDPR JSON exact schema - reverse-engineered from multiple sources; needs validation with real export
- react-dropzone React 19 timeline - not officially announced

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Vercel official docs confirm FastAPI + Next.js approach
- Architecture: MEDIUM - Patterns are sound but Spotify JSON structure varies
- Pitfalls: MEDIUM - Based on community reports and documentation

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days - relatively stable ecosystem)
