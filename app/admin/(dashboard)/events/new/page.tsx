"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nameEn: "",
    nameTh: "",
    descriptionEn: "",
    descriptionTh: "",
    startDate: "",
    endDate: "",
    dailyStartTime: "09:30:00",
    dailyEndTime: "22:00:00",
    coverImageUrl: "",
    isFeatured: false,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
      }),
    });
    if (res.ok) router.push("/admin/events");
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">New Event</h1>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
        <input className="input" placeholder="Name (EN)" value={form.nameEn} onChange={e=>setForm(f=>({...f,nameEn:e.target.value}))}/>
        <input className="input" placeholder="Name (TH)" value={form.nameTh} onChange={e=>setForm(f=>({...f,nameTh:e.target.value}))}/>

        <textarea className="textarea" placeholder="Description (EN)" value={form.descriptionEn} onChange={e=>setForm(f=>({...f,descriptionEn:e.target.value}))}/>
        <textarea className="textarea" placeholder="Description (TH)" value={form.descriptionTh} onChange={e=>setForm(f=>({...f,descriptionTh:e.target.value}))}/>

        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" className="input" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
          <input type="datetime-local" className="input" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Daily start (HH:mm:ss)" value={form.dailyStartTime} onChange={e=>setForm(f=>({...f,dailyStartTime:e.target.value}))}/>
          <input className="input" placeholder="Daily end (HH:mm:ss)" value={form.dailyEndTime} onChange={e=>setForm(f=>({...f,dailyEndTime:e.target.value}))}/>
        </div>

        <input className="input" placeholder="Cover Image URL" value={form.coverImageUrl} onChange={e=>setForm(f=>({...f,coverImageUrl:e.target.value}))}/>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.isFeatured} onChange={e=>setForm(f=>({...f,isFeatured:e.target.checked}))}/>
          <span>Featured</span>
        </label>

        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">Create</button>
          <button className="btn" type="button" onClick={()=>history.back()}>Cancel</button>
        </div>
      </form>
    </main>
  );
}
