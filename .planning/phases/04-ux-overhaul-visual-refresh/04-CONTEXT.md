# Phase 4: UX Overhaul & Visual Refresh - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve user experience, fix bugs, create inviting visual design, optimize mobile. Covers: transfer interaction simplification, OAuth UX improvements, unified progress bar, visual refresh (light theme), hydration error fix, debug log removal, mobile optimization.

</domain>

<decisions>
## Implementation Decisions

### Transfer Interaction
- Remove per-playlist Transfer buttons entirely
- All playlists selected by default (opt-out model)
- Small 'x' icon on each playlist card to exclude (dims/strikes through when excluded)
- Single "Transfer to YouTube Music" button in fixed bottom bar
- Bottom bar shows count: "Transfer X playlists to YouTube Music"

### Color Scheme & Visual Feel
- Switch from dark glassmorphism to light & clean theme
- White/light gray background
- Spotify green (#1db954) as primary accent
- Clean shadows, modern app feel (think Linear, Notion)
- Remove AnimatedBackground particles entirely
- Remove random purple/pink gradient colors

### OAuth Flow UX
- Simplified single action approach
- One prominent "Connect YouTube Music" button
- Code shown after click with clear instructions
- Auto-open google.com/device in new tab
- Copy button shows "Copied!" toast feedback
- Use actual Google expires_in value for timer (not 30 min)

### Progress Bar Behavior
- Single unified 0-100% progress (never resets)
- Matching tracks = 0-40%
- Creating playlist = 40-60%
- Adding tracks = 60-100%
- Show current phase as text label below percentage

### Bug Fixes (Required)
- Fix hydration error in AnimatedBackground.tsx (Math.random SSR mismatch)
- Remove all [DEBUG transferPlaylist] console.logs
- Remove unused MusicVisualizer export from ui/index.ts

### Mobile Optimization
- Responsive audit: smaller cards, tighter spacing
- Touch-friendly but not oversized elements
- Bottom bar works well on mobile (safe area padding)

### Claude's Discretion
- Exact color values for light theme (within white/gray/green palette)
- Card shadow intensity and border radius
- Typography sizing adjustments
- Loading states and skeleton designs

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- GlassCard.tsx: Will need refactoring for light theme or replacement
- Checkbox.tsx: Keep but update colors for light theme
- TransferProgress.tsx: Refactor for unified progress calculation

### Established Patterns
- CSS variables in globals.css for theming (can update for light theme)
- Framer Motion for animations (keep)
- Lucide icons throughout (keep)

### Integration Points
- page.tsx: Remove checkbox state, add exclusion state, add fixed bottom bar
- YouTubeAuthButton.tsx: Refactor OAuth messaging and copy feedback
- AnimatedBackground.tsx: Remove or fix hydration (recommend remove for light theme)
- TransferProgress.tsx: Unified progress calculation

</code_context>

<specifics>
## Specific Ideas

- "Modern app feel like Linear or Notion" - clean, minimal, professional
- "Inviting and happy" - not corporate sterile, but friendly
- Fixed bottom bar should feel native on mobile (like app action bars)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 04-ux-overhaul-visual-refresh*
*Context gathered: 2026-03-14*
