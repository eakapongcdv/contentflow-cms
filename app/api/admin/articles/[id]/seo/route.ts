// app/api/admin/articles/[id]/seo/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // ตรวจว่ามีบทความอยู่จริง
  const article = await prisma.article.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const seo = await prisma.seoMeta.findUnique({
    where: { contentType_targetId: { contentType: "article", targetId: id } },
  });

  return NextResponse.json({ article, seo });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  // ตรวจว่ามีบทความอยู่จริง
  const article = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const data = {
    contentType: "article" as const,
    targetId: id,
    metaTitleTh: body.metaTitleTh ?? null,
    metaTitleEn: body.metaTitleEn ?? null,
    metaDescriptionTh: body.metaDescriptionTh ?? null,
    metaDescriptionEn: body.metaDescriptionEn ?? null,
    metaKeywordsTh: body.metaKeywordsTh ?? null,
    metaKeywordsEn: body.metaKeywordsEn ?? null,
    ogTitle: body.ogTitle ?? null,
    ogDescription: body.ogDescription ?? null,
    ogImageUrl: body.ogImageUrl ?? null,
    canonicalUrl: body.canonicalUrl ?? null,
    robotsNoindex: !!body.robotsNoindex,
    robotsNofollow: !!body.robotsNofollow,
    structuredData: body.structuredData ?? null, // JSON-LD
  };

  const upserted = await prisma.seoMeta.upsert({
    where: { contentType_targetId: { contentType: "article", targetId: id } },
    update: data,
    create: data,
  });

  return NextResponse.json(upserted);
}
