import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
export default async function ListPage(){
  const items = await prisma.category.findMany({ orderBy: { sort: "asc" } });
  return (<div className="card p-6">
    <div className="flex items-center justify-between"><h1 className="text-xl font-semibold capitalize">category</h1>
      <Link href="/admin/category/new" className="btn btn-primary">New</Link></div>
    <table className="w-full text-sm mt-4"><thead><tr>
      <th className="text-left p-2">Title/Name</th><th className="text-left p-2">Sort</th><th className="text-left p-2">Actions</th>
    </tr></thead><tbody>
      {items.map(i => (<tr key={i.id} className="border-t">
        <td className="p-2">{(i as any).title || (i as any).name}</td>
        <td className="p-2">{i.sort}</td>
        <td className="p-2"><Link className="underline" href={`/admin/category/$${i.id}`}>Edit</Link></td>
      </tr>))}
    </tbody></table></div>);
}
