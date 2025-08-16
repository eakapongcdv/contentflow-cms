

# ContentFlow CMS — **Admin Area** (After Login)

This document is the **single source of truth** for the admin-side (all routes under `admin/*`) of **ContentFlow AI Suite**.  
It summarizes *what exists right now*, how things are wired together, and *how to extend safely*.

> ✅ Status legend: **Implemented** | 🚧 **In progress** | 📝 **Planned**

---

## 1) What the Admin is for

- Manage content, teams, and configuration safely behind authentication.
- Centralize operations that require **RBAC/ACL**, auditability, and non‑public APIs.
- Integrate with external systems (SSO, storage, analytics) through server routes.

---

## 2) Key Files & Folders (as of this repo)

> Based on the latest `repo-map.md` snapshot and actual files referenced in the codebase.

- `middleware.ts` — NextAuth guard for **`/admin/*`** and **`/api/admin/*`**
  - Allows `/admin/login` without token to avoid redirect loops.
  - Protects other admin pages & admin APIs.
- `app/admin/(auth)/login/page.tsx` — **Login UI** (Credentials + Google + Azure) **✅**
  - Uses `next-auth/react` → `signIn('credentials' | 'google' | 'azure-ad')`
  - UX touches: remember email (localStorage), inline errors (OAuthAccountNotLinked, AccessDenied), callbackUrl handling.
  - Atomic styles via utility classes such as `admin-card`, `admin-btn`, `admin-input`.
- `app/admin/*` — All **post‑login** pages live here (dashboard, content, settings, etc.) **🚧**
  - Add new pages as `app/admin/feature/page.tsx`.
- `app/api/admin/*` — Server routes for admin-only operations **🚧**
- `prisma/schema.prisma` — Data model & ACL primitives **🚧**
  - (from `repo-map.md` lines) Enums `AclSubject`, `AclAction`, `AclEffect`; Models `UserGroup`, `UserGroupMember`, `AccessControl` (used for RBAC-style rules).
- Shared UI:
  - `app/components/SiteHeader.tsx`, `app/components/SiteFooter.tsx` — Public layout; can be reused in admin if desired.
  - `app/components/widgets/AiAgent.tsx` — Floating assistant (optional on admin pages).

> If you move or rename these files, update this README-ADMIN to keep it the ground truth.

---

## 3) Authentication & Authorization

**Auth Guard (middleware)**  
```ts
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      const p = req.nextUrl.pathname;
      if (p.startsWith("/admin/login")) return true;   // allow login page
      const isAdmin = p.startsWith("/admin") || p.startsWith("/api/admin");
      return isAdmin ? !!token : true;                 // require token in admin
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

**Login Page Behavior** (`app/admin/(auth)/login/page.tsx`)
- Providers:
  - Credentials (email/password)
  - Google OAuth (`id: "google"`)
  - Microsoft Azure AD (`id: "azure-ad"` or AD B2C variant)
- UX:
  - “Remember me” (saves email to `localStorage` under `admin:rememberEmail`)
  - Non‑intrusive errors; `redirect: false` then do manual `window.location.href = res.url ?? fallbackUrl`
  - Password reveal toggle

**RBAC/ACL (Prisma primitives)**  
- Entities (from the schema excerpt in `repo-map.md`):
  - `UserGroup` and `UserGroupMember` — assign users to groups
  - `AccessControl` — rule table combining:
    - `AclSubject` (what object/area), `AclAction` (what action), `AclEffect` (ALLOW/DENY)
- Strategy: check rules at server routes (`/api/admin/*`) and optionally in UI to hide unavailable actions.

---

## 4) Admin Feature Map

> A pragmatic view of what’s in the codebase vs. near‑term roadmap.

| Area | Purpose | Status |
|---|---|---|
| **Auth** | NextAuth login, OAuth, middleware guard | ✅ |
| **Dashboard** | KPIs, quick links post‑login | 🚧 |
| **Content** | CRUD for posts/pages, localization | 📝 |
| **Media** | Asset library, uploads, CDN links | 📝 |
| **Workflow** | Draft → Review → Publish, assignments | 📝 |
| **Users & Groups** | Manage users, groups, roles | 🚧 (schema present) |
| **Access Control** | Fine‑grained ACL (subject/action/effect) | 🚧 (schema present) |
| **Settings** | Branding, SEO, integrations, i18n | 🚧 |
| **Admin APIs** | `/api/admin/*` for secured operations | 🚧 |

---

## 5) UX & Design System (Admin)

- **Cards & panels**: use `admin-card` (`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6`)
- **Buttons**: `admin-btn` (primary) and border/ghost variations
- **Inputs**: `admin-input` (paired with labels & helper text)
- **Feedback**: inline alerts for errors, `aria-live="polite"` where appropriate
- **Accessibility**: keyboard focus ring, `aria-busy` on form submit, `role="alert"`

> Keep the visual language consistent with the public site (Dark‑Neon theme). Avoid heavy custom CSS; leverage Tailwind utilities.

---

## 6) Adding a New Admin Page

1. Create a file under `app/admin/<feature>/page.tsx`:
   ```tsx
   // app/admin/content/page.tsx
   export default function ContentAdminPage() {
     return (
       <main className="px-4 md:px-6 py-8 text-white">
         <h1 className="text-2xl font-semibold">Content</h1>
         {/* Your feature here */}
       </main>
     );
   }
   ```
2. The page is automatically protected by `middleware.ts`.
3. For server actions/APIs, implement under `app/api/admin/<feature>/route.ts` and validate ACL on the server.

---

## 7) Environment & Secrets

Set in `.env.local` (examples):

```ini
# NextAuth
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=replace_with_strong_secret

# Credentials provider (if you check passwords yourself)
# e.g., DATABASE_URL for Prisma
DATABASE_URL=postgresql://user:pass@localhost:5432/contentflow

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Azure AD
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
```

> For any provider you disable, hide its button in the login UI to reduce confusion.

---

## 8) Dev, Build, Deploy

```bash
# Install
pnpm install    # or yarn / npm

# Local dev
pnpm dev        # default on http://localhost:4000

# Type check & lint
pnpm typecheck
pnpm lint

# Build & start
pnpm build
pnpm start
```

- Tailwind config: `tailwind.config.js`
- Fonts: `app/fonts.ts`
- Public assets: `public/` (e.g., logos, SVGs)

---

## 9) Testing the Guard Quickly

- Visit `/admin/login` → should render the login form.
- Visit `/admin` (not logged in) → should redirect to `/admin/login`.
- After successful login → should land on `/admin/` (or `callbackUrl`).

---

## 10) Coding Guidelines

- **TypeScript first** (no `any` without justification).
- **Server‑first checks** for ACL; **UI hides** unavailable actions, but do not rely on UI only.
- **Keep admin UI fast**: avoid blocking fetches in initial paint; stream or skeleton if needed.
- **i18n**: Admin may start with a single language; use clear, simple English/Thai labels and centralize copy for future i18n.

---

## 11) Roadmap (short)

- [ ] CRUD for content with localization
- [ ] Media library with uploads & CDN presets
- [ ] UI for Groups/Roles/ACL rules
- [ ] Audit trail (write ops on `/api/admin/*`)
- [ ] Bulk actions & import/export
- [ ] E2E smoke tests for auth flows

---

### Quick FAQ

**Q: Where should admin-only APIs live?**  
A: Under `app/api/admin/*`. They’re covered by `middleware.ts` matcher.

**Q: Can I reuse the public `SiteHeader`/`SiteFooter` in admin?**  
A: Yes, or create `app/admin/components/*` if you need a simplified header.

**Q: How to show “Access denied”?**  
A: Check ACL server-side; respond `403`. In the page, render a friendly empty‑state with a back link.

---

**Maintainer note:** When you add/move files in `admin/*` or update Prisma ACL entities, please update this `README-ADMIN.md` so the next contributor can navigate instantly.