import { prisma } from "@/app/lib/prisma";
import Form from "./form";
export default async function EditPage({ params }: { params: { id: string } }){
  const isNew = params.id === "new";
  const data = isNew ? null : await prisma.brand.findUnique({ where: { id: params.id } });
  return <Form initial={data} isNew={isNew} />;
}
