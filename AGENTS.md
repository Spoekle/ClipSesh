<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CLAUDE.md

You are working in a production TypeScript + React / Next.js repository for ClipSesh. Make safe, minimal, maintainable changes that fit the existing architecture.

**Primary rule**: before changing code, read the surrounding files and follow the patterns already present. Prefer the pattern used closest to the code you are editing.

---

## Stack

| Concern         | Tool                                                                |
| --------------- | ------------------------------------------------------------------- |
| Package manager | `npm`                                                               |
| Framework       | Next.js 16 (App Router) + React 19 + TypeScript                     |
| Server          | Custom Node.js HTTP server (`server.ts` via `tsx`)                  |
| Database / ODM  | MongoDB + Mongoose 9                                                |
| Real-time       | Socket.IO (`socket.io` & `socket.io-client`)                        |
| Client state    | TanStack React Query v5 + `@/lib/apiClient`                         |
| Styling         | Tailwind CSS v4 (`src/app/globals.css`)                             |
| Bot             | Discord.js v14 (`src/bot/discordBot.ts`)                            |
| Media           | Fluent-ffmpeg, `@distube/ytdl-core`, `archiver`                     |

---

## Commands

- `npm run dev` — start the unified dev server (`tsx server.ts` hosting Next.js, Socket.IO, Discord bot, and season scheduler on port 3000)
- `npm run dev:next` — start standalone Next.js dev server
- `npm run build` — build Next.js application for production
- `npm start` — run production unified server (`NODE_ENV=production tsx server.ts`)
- `npm run start:next` — start standalone Next.js production server
- `npm run lint` — run Next.js linter

---

## Architecture & Project Structure

- `server.ts` — Unified HTTP entrypoint initializing database connection, admin bootstrap, static media routes (`/uploads`, `/profilePictures`, `/download`), Next.js request handler, Socket.IO, Discord bot, and season scheduler.
- `src/app/` — Next.js App Router containing route pages (`/clips`, `/admin`, `/archive`, etc.) and API Route Handlers in `src/app/api/.../route.ts`.
- `src/components/` — Reusable UI components (`AppShell`, `Navbar`, `Footer`, `LoginModal`, `RequireAuth`, `PopupAlerts`, common layouts).
- `src/hooks/` — Custom hooks and TanStack React Query hooks (`useClips`, `useUser`, `useRatings`, `useSocket`, `useAuthToken`, etc.).
- `src/services/` — Client-side API service functions wrapping `apiClient` (`clipService`, `userService`, `ratingService`, `adminService`, etc.).
- `src/lib/` — Shared server and client utilities:
  - `apiClient.ts` — Custom fetch client with auth token headers and query parameter serialization.
  - `react-query.ts` — `QueryClient` configuration and centralized `queryKeys`.
  - `db.ts` — Mongoose database connection with global caching.
  - `auth.ts` — JWT token extraction, signing, password hashing, and `requireAuth` route protection.
  - `socketHandler.ts` & `WebSocketManager.ts` — Real-time event handling.
  - `seasonScheduler.ts` & `seasonHelpers.ts` — Automated season lifecycle logic.
  - `zipProcessing.ts` & `videoDownloader.ts` — Video downloading and zip packaging.
- `src/models/` — Mongoose schemas and models (`clipModel`, `userModel`, `ratingModel`, `configModel`, etc.).
- `src/bot/` — Discord bot service for community clip submission and ingestion.
- `src/context/` — React Context providers (`AlertContext`).
- `src/types/` — Shared TypeScript type definitions and interfaces.
- `src/utils/` — Client/server utilities (`storage.ts` with `safeLocalStorage`, `fileHelpers.ts`, etc.).
- `uploads/`, `profilePictures/`, `download/` — Runtime static media directories served directly by `server.ts`.

---

## Generated files

- Generated files should be gitignored.
- Do not edit generated files.
- Include new generated files/folders in the gitignore, under the right comment heading.
- Gitignored files not under the specific generated files heading are not necessarily generated, and thus are exempt from this rule.

---

## TypeScript

- No `any`
- No casts — help the compiler infer correctness through runtime logic. If a third-party type makes this impossible, cast with a comment explaining why. Last resort only.
- No non-null assertions — prefer type guards and narrowing
- No duplicate type definitions — reuse exported types from `src/types/`, `src/models/`, hooks, or services
- Add JSDoc to util functions you create, including at least one example. Add docs to existing util functions you edit that are missing them. Keep types in typescript.

---

## React

- Extract into subcomponents or hooks when a component exceeds ~150–200 LOC
- Add `'use client';` directive to the top of client components (using hooks, context, browser APIs, or framer-motion)
- Always use `safeLocalStorage` from `@/utils/storage` instead of direct `localStorage` to avoid SSR hydration mismatches
- No global state for local UI concerns
- No `useEffect` for logic that can run during render, in event handlers, or as derived/memoized values
- No `useMemo` / `useCallback` unless solving a real referential stability or performance problem

---

## CSS

- Style with Tailwind utility classes; no SCSS and no new per-component CSS files
- Use the new Tailwind v4 variable syntax (e.g. h-300, flex, grid, grow, etc)
- Prefer the semantic tokens (`bg-primary`, `text-muted-foreground`, `bg-cc-card`, `text-cc-text`, `bg-cc-red`, …) over raw palette variables in `src/app/globals.css`
- Put reusable styles in `src/app/globals.css` as a `@utility` or `@theme` token

---

## Data fetching & State

- Use the existing service layer (`src/services/`) calling `apiClient` (`@/lib/apiClient`) paired with TanStack Query hooks in `src/hooks/`
- Centralize query keys in `src/lib/react-query.ts` (`queryKeys`)
- Always handle loading, empty, and error states
- Invalidate or refetch relevant query keys on mutations to keep UI in sync
- Never hardcode URLs, tokens, or environment-specific values

---

## Routing

- Uses Next.js App Router (`src/app/`)
- Page components live in `src/app/<route>/page.tsx` and route-specific layouts in `layout.tsx`
- API Route Handlers live in `src/app/api/<endpoint>/route.ts` using `NextRequest` and `NextResponse`
- Navigation: use Next.js `next/link` (`<Link>`) and `next/navigation` hooks (`useRouter`, `usePathname`, `useSearchParams`, `useParams`)
- Protect authenticated and role-restricted client routes using `<RequireAuth>` (`isAdminRequired`, `isEditorRequired`, `isVerifiedRequired`)

---

## Backend & Database

- Always call `await connectToDatabase()` in API Route Handlers before interacting with Mongoose models
- Protect sensitive API routes using `requireAuth(req, allowedRoles)` from `@/lib/auth`
- Use Mongoose models in `src/models/` for database interactions with typed schemas
- Broadcast real-time notifications and updates through the Socket.IO server (`global.socketIoInstance`)

---

## Scope

- Change only what is necessary for the requested outcome
- Do not refactor files you are not already modifying
- Do not add dependencies unless clearly necessary — prefer what is already in `package.json`
- Do not add comments unless the _why_ is non-obvious to a future reader

---

## Tests

- Only write tests if similar tests already exist, or explicitly asked to
- Never use snapshots
- Never write unit tests for components

