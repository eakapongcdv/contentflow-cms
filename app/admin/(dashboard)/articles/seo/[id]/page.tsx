// app/admin/(dashboard)/articles/seo/[id]/page.tsx
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import ArticleSeoForm from "../../ui/ArticleSeoForm";

function buildAbsoluteUrl(path: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}

async function fetchArticle(id: string) {
  const url = buildAbsoluteUrl(`/api/admin/articles/${id}`);
  const res = await fetch(url, { cache: "no-store", headers: { cookie: cookies().toString() } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load article: ${res.status}`);
  return res.json();
}

async function fetchSeo(id: string) {
  // หมายเหตุ: หน้านี้คาดหวัง API GET /api/admin/articles/[id]/seo (ถ้าไม่มีจะ fallback เป็นค่า default ในฟอร์ม)
  const url = buildAbsoluteUrl(`/api/admin/articles/${id}/seo`);
  const res = await fetch(url, { cache: "no-store", headers: { cookie: cookies().toString() } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load seo: ${res.status}`);
  return res.json();
}

export default async function ArticleSeoPage({ params }: { params: { id: string } }) {
  const article = await fetchArticle(params.id);
  if (!article) notFound();

  const seo = await fetchSeo(params.id).catch(() => null);

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">SEO: {article?.translations?.th?.title || article?.translations?.en?.title || article?.id}</h1>
      <div className="card p-4">
        <ArticleSeoForm articleId={params.id} initialSeo={seo || undefined} article={article} />
      </div>
    </div>
  );
}
