import { prisma } from "@/app/lib/prisma";
import PromotionForm from "../ui/PromotionForm";

export default async function EditPromotionPage({ params }: { params: { id: string } }) {
  const item = await prisma.promotion.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-gray-500">Not found</div>;

  // โหลด SEO (ตารางแยก)
  const seo = await prisma.seoMeta.findUnique({
    where: { contentType_targetId: { contentType: "promotion", targetId: params.id } },
  });

  const initial = {
    ...item,
    startDate: new Date(item.startDate).toISOString().slice(0, 16),
    endDate: new Date(item.endDate).toISOString().slice(0, 16),
    localCategoryIds: (item.localCategoryIds || []).join(","),
  };

  return (
    <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Edit Promotion</h1>
      <PromotionForm mode="edit" id={item.id} initial={initial as any} initialSeo={seo as any} />
    </div>
  );
}
