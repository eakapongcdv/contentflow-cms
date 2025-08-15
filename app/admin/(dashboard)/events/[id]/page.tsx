import { PrismaClient } from "@prisma/client";
import EventForm from "./form";

const prisma = new PrismaClient();

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const item = await prisma.event.findUnique({ where: { id: params.id } });
  if (!item) return <main className="p-6">Not found</main>;
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Event</h1>
      <EventForm item={item} />
    </main>
  );
}
