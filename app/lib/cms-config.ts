// app/lib/cms-config.ts
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { cmsTemplate as defaultCmsTemplate, type CmsTemplate } from "@/app/cms.config";

function deepMerge<T>(base: any, override: any): T {
  if (!override) return base as T;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override)) {
    const bv = (base as any)?.[k];
    const ov = override[k];
    (out as any)[k] =
      bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)
        ? deepMerge(bv, ov)
        : ov;
  }
  return out as T;
}

export async function loadEffectiveCmsTemplate(explicitWebsiteId?: string | null) {
  const websiteId = explicitWebsiteId ?? cookies().get("websiteId")?.value ?? null;

  if (!websiteId) {
    return { template: defaultCmsTemplate as CmsTemplate, websiteId: null, websiteName: null };
  }

  const site = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true, name: true, settings: true },
  });

  if (!site) {
    return { template: defaultCmsTemplate as CmsTemplate, websiteId: null, websiteName: null };
  }

  const overrides = (site.settings as any)?.cmsTemplate || {};
  const template = deepMerge<CmsTemplate>(defaultCmsTemplate, overrides);

  return { template, websiteId: site.id, websiteName: site.name ?? null };
}
