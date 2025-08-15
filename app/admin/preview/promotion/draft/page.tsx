// app/admin/preview/promotion/draft/page.tsx
import NextDynamic from "next/dynamic";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// โหลด Client component แบบไม่ทำ SSR เพื่อกัน hydration mismatch
const DraftPreviewClient = NextDynamic(() => import("./DraftPreviewClient"), { ssr: false });

export default function PromotionDraftPreviewPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const d = typeof searchParams.d === "string" ? searchParams.d : "";

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-white to-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="container-narrow flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-zpell" />
            <span className="font-semibold">Preview — Promotion (Draft)</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/promotions" className="btn btn-outline-zpell">← Back</Link>
          </div>
        </div>
      </header>

      {/* Body (render ฝั่ง client เท่านั้น) */}
      <main className="container-narrow section">
        <DraftPreviewClient encoded={d} />
      </main>
    </div>
  );
}
