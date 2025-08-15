"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Form({ initial, isNew }: any){
  const router = useRouter(); const [loading,setLoading]=useState(false);
  async function onSubmit(e:any){ e.preventDefault(); setLoading(true);
    const form = new FormData(e.currentTarget); const body:any = Object.fromEntries(form.entries());
    if (body.sort) body.sort = Number(body.sort);
    if (body.dateFrom) body.dateFrom = new Date(body.dateFrom).toISOString();
    if (body.dateTo) body.dateTo = new Date(body.dateTo).toISOString();
    if (body.isPublished) body.isPublished = body.isPublished === "on";
    const res = await fetch(`/api/admin/heroSlide${isNew?"":`/${initial.id}`}`, { method:isNew?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (res.ok) router.push("/admin/heroSlide"); setLoading(false);
  }
  async function onDelete(){ if(!initial?.id) return; if(!confirm("Delete?")) return; await fetch(`/api/admin/heroSlide/${initial.id}`,{method:"DELETE"}); router.push("/admin/heroSlide"); }
  return (<div className="card p-6 max-w-2xl">
    <h1 className="text-xl font-semibold mb-4">{isNew?"Create":"Edit"} heroSlide</h1>
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="label">title</label><input className="input" name="title" defaultValue={(initial?.title as any) ?? ""} /><label className="label">subtitle</label><input className="input" name="subtitle" defaultValue={(initial?.subtitle as any) ?? ""} /><label className="label">imageUrl</label><input className="input" name="imageUrl" defaultValue={(initial?.imageUrl as any) ?? ""} />

      <label className="label">sort</label><input className="input" name="sort" type="number" defaultValue={(initial?.sort as any) ?? 0} />
      <div className="flex gap-2 mt-4"><button className="btn btn-primary" disabled={loading}>{loading?"Saving...":"Save"}</button>
      {!isNew && <button type="button" className="btn" onClick={onDelete}>Delete</button>}</div>
    </form></div>);
}
