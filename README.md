# Future Park & Zpell CMS (Headless)
Next.js App Router + Prisma (PostgreSQL) + NextAuth + Tailwind.

## Setup
1. Copy `.env.example` to `.env` and set DATABASE_URL, NEXTAUTH_SECRET.
2. `npm install`
3. `npx prisma migrate dev --name init`
4. `npm run prisma:seed` (creates ADMIN user from env)
5. `npm run dev`

- Login: `/admin/login` (ADMIN_EMAIL / ADMIN_PASSWORD)
- Manage content in `/admin/*`
- Public endpoint `/` reads content from DB (replace with your themed frontend).

//
git ls-files -co --exclude-standard > directory-list.txt
tree -a -I 'node_modules|.git|.next|dist|build|.turbo|.vercel|coverage|.DS_Store' > directory-tree.txt


# โครงสร้าง 3 ชั้น (ตัดโฟลเดอร์หนัก ๆ ออก)
tree -a -L 3 -I 'node_modules|.next|dist|.git|coverage|.turbo' > repo-map.md

# รายชื่อ API routes ที่สำคัญ
fd '^route\.ts$' app/api -x echo {} >> repo-map.md

# สรุปชื่อโมเดลใน Prisma
rg '^model\s+\w+' prisma/schema.prisma >> repo-map.md


npx madge app --tsConfig tsconfig.json --extensions ts,tsx --image dep-graph.png