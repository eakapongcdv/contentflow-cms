# Repo Map

Generated: 2025-08-16T09:59:42+07:00

## Tree (top 3 levels)
```
.
repo-map.md
middleware.ts
tailwind.config.js
.DS_Store
app
  contact
    page.tsx
  fonts.ts
  .DS_Store
  security
    page.tsx
  terms
    page.tsx
  admin
    .DS_Store
    globals-v1.css
    layout.tsx
    preview
    aurora-parallax.tsx
    (auth)
    (dashboard)
    globals.css
    AdminDarkNeonBg.tsx
  sitemap
    page.tsx
  about
    page.tsx
  docs
    page.tsx
  cms.config.ts
  occupants
    [id]
  careers
    [id]
    page.tsx
    _data.ts
  components
    SiteFooter.tsx
    ui
    pagination.tsx
    language-flag.tsx
    SiteHeader.tsx
    geo-sort-button.tsx
    highlight.tsx
    admin-nav.tsx
    PageShell.tsx
    search-bar.tsx
    search-page-client.tsx
    logout-button.tsx
    viewport-heights.tsx
    tracked-link.tsx
    icons.tsx
    BackgroundLayer.tsx
    voice-search-modal.tsx
    ClientLangLayout.tsx
    LanguageSwitcher.tsx
    search-results-with-map.tsx
    widgets
  partners
    page.tsx
  layout.tsx
  lib
    prisma.ts
    perm-client.ts
    perm.ts
    cms-config.ts
    version.ts
  api
    track-click
    .DS_Store
    voice-search
    auth
    admin
    ai-agent
  fonts
    .DS_Store
    dbx
  page.tsx
  globals.css
  policy
    page.tsx
  pdpa
    page.tsx
vercel.json
next.config.js
prisma
  .DS_Store
  seed-acl-admin.js
  schema.prisma
  seed-article.js
  seed-acl.js
  seed-website.js
  seed-promotion.js
  seed-event.js
  seed.js
  data
    event.json
    promotion.json
    occupant.json
    pages.json
next-env.d.ts
README.md
public
  .DS_Store
  logo_.png
  images
    aws.svg
    background_image.png
    azure.svg
    alibaba.svg
    futurepark.jpg
    logo.svg
  basic.ics
  logo.png
.gitignore
package-lock.json
package.json
.env
scripts
  gen-repo-map.sh
  backfill-seo-keywords.ts
.gitattributes
tsconfig.json
.env.example
postcss.config.js
```

## API routes (app/api/**/route.ts)
```
./app/api/admin/ai/article/route.ts
./app/api/admin/ai/promotion/route.ts
./app/api/admin/articles/[id]/route.ts
./app/api/admin/articles/[id]/seo/route.ts
./app/api/admin/articles/route.ts
./app/api/admin/brand/[id]/route.ts
./app/api/admin/brand/route.ts
./app/api/admin/category/[id]/route.ts
./app/api/admin/category/route.ts
./app/api/admin/events/[id]/route.ts
./app/api/admin/events/route.ts
./app/api/admin/feature/[id]/route.ts
./app/api/admin/feature/route.ts
./app/api/admin/heroSlide/[id]/route.ts
./app/api/admin/heroSlide/route.ts
./app/api/admin/holidays/route.ts
./app/api/admin/infoCard/[id]/route.ts
./app/api/admin/infoCard/route.ts
./app/api/admin/occupants/[id]/route.ts
./app/api/admin/occupants/route.ts
./app/api/admin/promotions/[id]/route.ts
./app/api/admin/promotions/route.ts
./app/api/admin/user-group/route.ts
./app/api/admin/user/[id]/route.ts
./app/api/admin/user/route.ts
./app/api/admin/users/[id]/route.ts
./app/api/admin/users/route.ts
./app/api/admin/website/config/route.ts
./app/api/admin/website/select/route.ts
./app/api/admin/website/stylesheet/route.ts
./app/api/admin/websites/route.ts
./app/api/ai-agent/route.ts
./app/api/auth/[...nextauth]/route.ts
./app/api/auth/forgot/route.ts
./app/api/auth/reset/route.ts
./app/api/track-click/route.ts
./app/api/voice-search/route.ts
```

## Prisma models/enums (prisma/schema.prisma)
```
10:model User {
26:enum Role {
31:model Session {
41:model Account {
60:model VerificationToken {
68:model HeroSlide {
78:model Category {
90:model Feature {
100:model Brand {
109:model InfoCard {
118:model Occupant {
183:model SearchLog {
192:model ClickLog {
207:model Event {
258:model SeoMeta {
283:model Promotion {
344:enum WebsiteTemplate {
353:model Website {
385:enum ArticleStatus {
392:model Tag {
401:model Article {
435:model ArticleCategory {
445:model ArticleTag {
455:enum Locale3 {
461:model ArticleI18n {
487:enum AclSubject {
493:enum AclAction {
505:enum AclEffect {
510:model UserGroup {
523:model UserGroupMember {
534:model AccessControl {
```

## package.json scripts
```
```

