// app/admin/(dashboard)/articles/[id]/page.tsx
import { headers, cookies } from "next/headers";
import ArticleForm from "@/app/admin/(dashboard)/articles/ui/ArticleForm";
import Link from "next/link";

/** สร้าง absolute URL จากคำขอปัจจุบัน */
function abs(path: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}

/** แปลง cookies() -> header string */
function buildCookieHeader() {
  const all = cookies().getAll();
  return all.map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`).join("; ");
}

async function loadArticle(id: string) {
  const url = abs(`/api/admin/articles/${id}`);
  const cookieHeader = buildCookieHeader();
  const websiteId = cookies().get("websiteId")?.value;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
      ...(websiteId ? { "x-website-id": websiteId } : {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    return { error: `HTTP ${res.status}`, detail };
  }

  const data = await res.json();

  // ยอมรับหลายโครงสร้าง response
  const a =
    data?.item ??
    data?.article ??
    data?.data ??
    data; // fallback: ตรง ๆ

  // map translations -> i18n (ถ้าจำเป็น)
  const tr = a?.i18n ?? a?.translations ?? {};
  const i18n = {
    th: {
      title: tr?.th?.title ?? "",
      subtitle: tr?.th?.subtitle ?? "",
      excerpt: tr?.th?.excerpt ?? "",
      contentMd: tr?.th?.contentMd ?? "",
      contentHtml: tr?.th?.contentHtml ?? "",
    },
    en: {
      title: tr?.en?.title ?? "",
      subtitle: tr?.en?.subtitle ?? "",
      excerpt: tr?.en?.excerpt ?? "",
      contentMd: tr?.en?.contentMd ?? "",
      contentHtml: tr?.en?.contentHtml ?? "",
    },
    cn: {
      title: tr?.cn?.title ?? "",
      subtitle: tr?.cn?.subtitle ?? "",
      excerpt: tr?.cn?.excerpt ?? "",
      contentMd: tr?.cn?.contentMd ?? "",
      contentHtml: tr?.cn?.contentHtml ?? "",
    },
  };

  const initial = {
    slug: a?.slug ?? "",
    status: a?.status ?? "DRAFT",
    coverImageUrl: a?.coverImageUrl ?? null,
    coverImageW: a?.coverImageW ?? null,
    coverImageH: a?.coverImageH ?? null,
    authorName: a?.authorName ?? "",
    readingTime: a?.readingTime ?? null,
    publishedAt: a?.publishedAt ?? null,
    scheduledAt: a?.scheduledAt ?? null,
    i18n,
  };

  const seo = a?.seo ?? a?.meta ?? {};
  const initialSeo = {
    metaTitleTh: seo?.metaTitleTh ?? null,
    metaTitleEn: seo?.metaTitleEn ?? null,
    metaDescriptionTh: seo?.metaDescriptionTh ?? null,
    metaDescriptionEn: seo?.metaDescriptionEn ?? null,
    metaKeywordsTh: seo?.metaKeywordsTh ?? null,
    metaKeywordsEn: seo?.metaKeywordsEn ?? null,
    ogTitle: seo?.ogTitle ?? null,
    ogDescription: seo?.ogDescription ?? null,
    ogImageUrl: seo?.ogImageUrl ?? (a?.coverImageUrl ?? null),
    canonicalUrl: seo?.canonicalUrl ?? null,
    robotsNoindex: !!seo?.robotsNoindex,
    robotsNofollow: !!seo?.robotsNofollow,
    structuredData: seo?.structuredData ?? null,
  };

  return { data: { initial, initialSeo } };
}

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const result = await loadArticle(params.id);

  if ("error" in result) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Article</h1>
          <Link href="/admin/articles" className="btn btn-outline-zpell">
            Back
          </Link>
        </div>

        <div className="card p-4 border-red-200 bg-red-50">
          <div className="text-sm font-semibold text-red-700">
            Failed to load: {result.error}
          </div>
          {result.detail ? (
            <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap">{result.detail}</pre>
          ) : null}
        </div>
      </div>
    );
  }

  const { initial, initialSeo } = result.data!;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Article</h1>
        <Link href="/admin/articles" className="btn btn-outline-zpell">
          Back
        </Link>
      </div>

      <ArticleForm mode="edit" id={params.id} initial={initial} initialSeo={initialSeo} />
    </div>
  );
}
