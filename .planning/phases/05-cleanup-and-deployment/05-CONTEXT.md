# Phase 5: Code Cleanup & Deployment

## Goal
Clean up the codebase, improve code structure, remove dead code, and deploy to Vercel production.

## Background
After 4 phases of rapid development, the codebase has accumulated:
- Unused imports and variables
- Debug/console.log statements
- Inconsistent code patterns
- Unused components and CSS
- Test files that may need updates

Additionally, we need to:
- Rename the project folder from "PlaylistCopier" to "Portify"
- Configure Vercel for production deployment
- Set up environment variables properly
- Ensure the app works in production

## Tasks

### 5.1 Code Cleanup
- Remove unused imports across all files
- Remove console.log/debug statements
- Remove dead code and unused functions
- Clean up unused CSS classes
- Standardize code formatting

### 5.2 Code Structure
- Organize components logically
- Ensure consistent naming conventions
- Add missing TypeScript types where needed
- Review and clean up API routes

### 5.3 Test Cleanup
- Remove test scaffolds that were never implemented
- Ensure all tests pass
- Remove redundant test files

### 5.4 Vercel Deployment
- Verify vercel.json configuration
- Set up environment variables (Google OAuth credentials)
- Deploy to production
- Test the live application

## Success Criteria
1. No ESLint warnings/errors
2. No unused imports or dead code
3. All tests pass
4. App deploys successfully to Vercel
5. Production app works end-to-end (upload → auth → transfer)

## Notes
- The folder rename (PlaylistCopier → Portify) must be done manually by the user
- package.json already has name: "portify"
