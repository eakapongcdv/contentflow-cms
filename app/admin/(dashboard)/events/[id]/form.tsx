// app/admin/(dashboard)/events/EventForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Event } from "@prisma/client";

/* TinyMCE client-only */
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((m) => m.Editor),
  { ssr: false }
);

/* ================= Helpers ================= */
function toDatetimeLocalString(d: Date) {
  if (!d) return "";
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}
function csvToArray(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/* ================= Types ================= */
type SeoState = {
  metaTitleTh?: string;
  metaTitleEn?: string;
  metaDescriptionTh?: string;
  metaDescriptionEn?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  robotsNoindex?: boolean;
  robotsNofollow?: boolean;
  structuredData?: string; // JSON string (JSON-LD)
};

/* ================= Icons ================= */
const Icon = {
  chevron: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  collapseAll: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M7 10l5-5 5 5M7 19h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  expandAll: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M7 14l5 5 5-5M7 5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  calendar: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  clock: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  image: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M21 15l-4.5-4.5L9 18" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
  ),
  tag: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M20 13l-7 7-9-9V4h7l9 9Z" stroke="currentColor" strokeWidth="2"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>
  ),
  link: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  star: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  doc: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V8l-4-6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  gear: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7.4-3a7.4 7.4 0 0 1-.1 1l2.1 1.6-2 3.4-2.5-1a7.6 7.6 0 0 1-1.7 1l-.4 2.7H9.2l-.4-2.7a7.6 7.6 0 0 1-1.7-1l-2.5 1-2-3.4L4.7 13a7.4 7.4 0 0 1 0-2L2.6 9.4l2-3.4 2.5 1a7.6 7.6 0 0 1 1.7-1L9.2 3.3h5.6l.4 2.7a7.6 7.6 0 0 1 1.7 1l2.5-1 2 3.4L19.3 11Z" stroke="currentColor" strokeWidth="1.7"/></svg>
  ),
  seo: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9v9H3Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
};

/* ================= Reusable UI ================= */
function InputField({
  label,
  icon,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </span>
      <input {...props} className={`inp ${props.className || ""}`} />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

function RichText({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key";
  return (
    <div className="grid gap-1">
      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </span>
      <Editor
        apiKey={apiKey}
        value={value}
        init={{
          menubar: false,
          height: 260,
          plugins: [
            "advlist","autolink","lists","link","charmap","searchreplace",
            "visualblocks","code","fullscreen","insertdatetime","table","wordcount"
          ],
          toolbar:
            "undo redo | blocks | bold italic underline | " +
            "alignleft aligncenter alignright | bullist numlist outdent indent | link | removeformat",
          placeholder: placeholder || "",
          branding: false,
          statusbar: false,
          content_style:
            "body{font-family:ui-sans-serif, system-ui, -apple-system; font-size:14px; color:#111827}",
        }}
        onEditorChange={onChange}
      />
    </div>
  );
}

function ImageField({
  label,
  icon,
  value,
  onChange,
  name,
}: {
  label: string;
  icon?: React.ReactNode;
  value?: string;
  onChange: (v: string) => void;
  name: "coverImageUrl" | "logoUrl" | "coverSmallUrl";
}) {
  const has = !!value;
  return (
    <div className="group grid gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
          {icon && <span className="text-gray-500">{icon}</span>}
          {label}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline-zpell"
            onClick={() => {
              const url = prompt("Paste image URL", value || "") || "";
              onChange(url.trim());
            }}
          >
            Replace
          </button>
          <button
            type="button"
            className="btn btn-outline-zpell"
            onClick={() => onChange("")}
            disabled={!has}
          >
            Clear
          </button>
        </div>
      </div>

      {/* hidden url form value */}
      <input type="hidden" name={name} value={value || ""} />

      {/* fixed preview box height */}
      <div className="mt-1 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 grid place-items-center h-56">
        {has ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="h-full w-full object-contain p-3"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        ) : (
          <div className="text-xs text-gray-500">No Image</div>
        )}
      </div>
    </div>
  );
}

/* =============== Collapsible Section =============== */
function CollapsibleSection({
  title,
  subtitle,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b bg-[color-mix(in_srgb,var(--zp-primary)_8%,white)]"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl grid place-items-center border border-zpell/40 text-zpell bg-white">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          {Icon.chevron()}
        </span>
      </button>
      {open && <div className="p-4 grid gap-4">{children}</div>}
    </section>
  );
}

/* ================= Main ================= */
export default function EventForm({ item }: { item: Event }) {
  const router = useRouter();

  const [form, setForm] = useState({
    nameEn: item.nameEn ?? "",
    nameTh: item.nameTh ?? "",
    descriptionEn: item.descriptionEn ?? "",
    descriptionTh: item.descriptionTh ?? "",
    startDate: toDatetimeLocalString(new Date(item.startDate)),
    endDate: toDatetimeLocalString(new Date(item.endDate)),
    dailyStartTime: item.dailyStartTime ?? "",
    dailyEndTime: item.dailyEndTime ?? "",
    websiteLink: item.websiteLink ?? "",
    venueId: item.venueId ?? "",
    localCategoryIds: (item.localCategoryIds || []).join(","),
    coverImageUrl: item.coverImageUrl ?? "",
    logoUrl: item.logoUrl ?? "",
    coverSmallUrl: item.coverSmallUrl ?? "",
    isFeatured: !!item.isFeatured,
    locale: item.locale ?? "",
    order: item.order ?? 0,
    reference: item.reference ?? "",
    style: item.style ?? "",
    // quick OG default; can be overridden in SEO
    ogImageUrl: "",
    // ✅ SEO object (เหมือน OccupantForm)
    seo: {
      metaTitleTh: "",
      metaTitleEn: "",
      metaDescriptionTh: "",
      metaDescriptionEn: "",
      metaKeywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      canonicalUrl: "",
      robotsNoindex: false,
      robotsNofollow: false,
      structuredData: "",
    } as SeoState,
  });

  const [open, setOpen] = useState({
    basic: true,
    descriptions: true,
    schedule: true,
    media: true,
    meta: false,
    tags: false,
    seo: false,
  });

  const setAll = (v: boolean) =>
    setOpen({ basic: v, descriptions: v, schedule: v, media: v, meta: v, tags: v, seo: v });
  const toggle = (k: keyof typeof open) => () => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverForOG = useMemo(
    () => form.seo.ogImageUrl || form.ogImageUrl || form.coverImageUrl || "",
    [form.seo.ogImageUrl, form.ogImageUrl, form.coverImageUrl]
  );

  const updateSeo = (k: keyof SeoState, v: any) =>
    setForm((s) => ({ ...s, seo: { ...(s.seo || {}), [k]: v } }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nameEn: form.nameEn,
        nameTh: form.nameTh || null,
        descriptionEn: form.descriptionEn || null,
        descriptionTh: form.descriptionTh || null,
        startDate: form.startDate ? new Date(form.startDate) : new Date(),
        endDate: form.endDate ? new Date(form.endDate) : new Date(),
        dailyStartTime: form.dailyStartTime || null,
        dailyEndTime: form.dailyEndTime || null,
        websiteLink: form.websiteLink || null,
        venueId: form.venueId || null,
        localCategoryIds: csvToArray(form.localCategoryIds),
        isFeatured: !!form.isFeatured,
        coverImageUrl: form.coverImageUrl || null,
        logoUrl: form.logoUrl || null,
        coverSmallUrl: form.coverSmallUrl || null,
        locale: form.locale || null,
        order: Number(form.order) || 0,
        reference: form.reference || null,
        style: form.style || null,

        // OG image (fallback)
        ogImageUrl: coverForOG || null,

        // ✅ ส่ง SEO object ไปกับ API (ให้ backend map เข้าตาราง SEO แยก)
        seo: form.seo,
      };

      const res = await fetch(`/api/admin/events/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/admin/events");
      router.refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this event?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/events");
      router.refresh();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {/* Header + Collapse buttons */}
      <div className="card p-4 flex items-center justify-between shadow-card">
        <div>
          <div className="text-lg font-semibold">Edit Event</div>
          <div className="text-xs text-gray-500">ปรับรายละเอียดอีเวนต์ให้ครบถ้วน</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAll(false)}
            className="btn btn-outline-zpell"
            title="Collapse all"
            aria-label="Collapse all sections"
          >
            {Icon.collapseAll()}
          </button>
          <button
            type="button"
            onClick={() => setAll(true)}
            className="btn btn-outline-zpell"
            title="Expand all"
            aria-label="Expand all sections"
          >
            {Icon.expandAll()}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* BASIC */}
      <CollapsibleSection
        title="Basic"
        subtitle="ชื่ออีเวนต์และการแสดงผลหลัก"
        icon={Icon.doc()}
        open={open.basic}
        onToggle={toggle("basic")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Name (EN) *"
              icon={Icon.doc("h-4 w-4")}
              required
              value={form.nameEn}
              onChange={(e) => setForm((s) => ({ ...s, nameEn: (e.target as HTMLInputElement).value }))}
            />
            <InputField
              label="Name (TH)"
              icon={Icon.doc("h-4 w-4")}
              value={form.nameTh}
              onChange={(e) => setForm((s) => ({ ...s, nameTh: (e.target as HTMLInputElement).value }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="chip chip-emerald cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={form.isFeatured}
                onChange={(e) => setForm((s) => ({ ...s, isFeatured: e.target.checked }))}
              />
              Featured
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* DESCRIPTIONS */}
      <CollapsibleSection
        title="Descriptions"
        subtitle="คำอธิบาย 2 ภาษา (WYSIWYG)"
        icon={Icon.doc()}
        open={open.descriptions}
        onToggle={toggle("descriptions")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <RichText
            label="Description (EN)"
            icon={Icon.doc("h-4 w-4")}
            value={form.descriptionEn}
            onChange={(v) => setForm((s) => ({ ...s, descriptionEn: v }))}
            placeholder="Describe the event in English…"
          />
          <RichText
            label="Description (TH)"
            icon={Icon.doc("h-4 w-4")}
            value={form.descriptionTh}
            onChange={(v) => setForm((s) => ({ ...s, descriptionTh: v }))}
            placeholder="พิมพ์คำอธิบายภาษาไทย…"
          />
        </div>
      </CollapsibleSection>

      {/* SCHEDULE */}
      <CollapsibleSection
        title="Schedule"
        subtitle="กำหนดวัน–เวลาเริ่ม/สิ้นสุด และช่วงเวลาเปิดรายวัน"
        icon={Icon.calendar()}
        open={open.schedule}
        onToggle={toggle("schedule")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Start"
              icon={Icon.calendar("h-4 w-4")}
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((s) => ({ ...s, startDate: (e.target as HTMLInputElement).value }))}
            />
            <InputField
              label="End"
              icon={Icon.calendar("h-4 w-4")}
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((s) => ({ ...s, endDate: (e.target as HTMLInputElement).value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Daily Start (HH:mm:ss)"
              icon={Icon.clock("h-4 w-4")}
              placeholder="10:00:00"
              value={form.dailyStartTime}
              onChange={(e) => setForm((s) => ({ ...s, dailyStartTime: (e.target as HTMLInputElement).value }))}
            />
            <InputField
              label="Daily End (HH:mm:ss)"
              icon={Icon.clock("h-4 w-4")}
              placeholder="21:00:00"
              value={form.dailyEndTime}
              onChange={(e) => setForm((s) => ({ ...s, dailyEndTime: (e.target as HTMLInputElement).value }))}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* MEDIA */}
      <CollapsibleSection
        title="Media"
        subtitle="รูปปก/โลโก้ (พรีวิวสูงคงที่)"
        icon={Icon.image()}
        open={open.media}
        onToggle={toggle("media")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <ImageField
            label="Cover Image URL"
            icon={Icon.image("h-4 w-4")}
            name="coverImageUrl"
            value={form.coverImageUrl}
            onChange={(v) => setForm((s) => ({ ...s, coverImageUrl: v }))}
          />
          <ImageField
            label="Logo URL"
            icon={Icon.image("h-4 w-4")}
            name="logoUrl"
            value={form.logoUrl}
            onChange={(v) => setForm((s) => ({ ...s, logoUrl: v }))}
          />
          <ImageField
            label="Cover Small URL"
            icon={Icon.image("h-4 w-4")}
            name="coverSmallUrl"
            value={form.coverSmallUrl}
            onChange={(v) => setForm((s) => ({ ...s, coverSmallUrl: v }))}
          />
        </div>
      </CollapsibleSection>

      {/* META */}
      <CollapsibleSection
        title="Meta"
        subtitle="ลิงก์, สังกัด, ภาษาหน้า, ลำดับแสดงผล"
        icon={Icon.gear()}
        open={open.meta}
        onToggle={toggle("meta")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Website Link"
              icon={Icon.link("h-4 w-4")}
              placeholder="https://…"
              value={form.websiteLink}
              onChange={(e) => setForm((s) => ({ ...s, websiteLink: (e.target as HTMLInputElement).value }))}
            />
            <InputField
              label="Venue ID"
              icon={Icon.tag("h-4 w-4")}
              value={form.venueId}
              onChange={(e) => setForm((s) => ({ ...s, venueId: (e.target as HTMLInputElement).value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InputField
              label="Locale"
              icon={Icon.tag("h-4 w-4")}
              placeholder="th | en"
              value={form.locale}
              onChange={(e) => setForm((s) => ({ ...s, locale: (e.target as HTMLInputElement).value }))}
            />
            <InputField
              label="Order"
              icon={Icon.tag("h-4 w-4")}
              type="number"
              value={String(form.order)}
              onChange={(e) => setForm((s) => ({ ...s, order: Number((e.target as HTMLInputElement).value || 0) }))}
            />
            <InputField
              label="Reference"
              icon={Icon.tag("h-4 w-4")}
              value={form.reference}
              onChange={(e) => setForm((s) => ({ ...s, reference: (e.target as HTMLInputElement).value }))}
            />
          </div>

          <InputField
            label="Style"
            icon={Icon.tag("h-4 w-4")}
            placeholder="custom css class / theme tag"
            value={form.style}
            onChange={(e) => setForm((s) => ({ ...s, style: (e.target as HTMLInputElement).value }))}
          />
        </div>
      </CollapsibleSection>

      {/* TAGS */}
      <CollapsibleSection
        title="Tags / Local Categories"
        subtitle="คั่นด้วยจุลภาค เช่น events,exhibition,kids"
        icon={Icon.tag()}
        open={open.tags}
        onToggle={toggle("tags")}
      >
        <InputField
          label="Local Category IDs"
          icon={Icon.tag("h-4 w-4")}
          hint="เช่น expo,pet,food"
          value={form.localCategoryIds}
          onChange={(e) => setForm((s) => ({ ...s, localCategoryIds: (e.target as HTMLInputElement).value }))}
        />
      </CollapsibleSection>

      {/* ✅ SEO */}
      <CollapsibleSection
        title="SEO"
        subtitle="เมตาแท็กและข้อมูลโครงสร้าง (JSON-LD)"
        icon={Icon.seo()}
        open={open.seo}
        onToggle={toggle("seo")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Meta Title (TH)"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.metaTitleTh || ""}
              onChange={(e) => updateSeo("metaTitleTh", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Meta Title (EN)"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.metaTitleEn || ""}
              onChange={(e) => updateSeo("metaTitleEn", (e.target as HTMLInputElement).value)}
            />
            <RichText
              label="Meta Description (TH)"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.metaDescriptionTh || ""}
              onChange={(v) => updateSeo("metaDescriptionTh", v)}
            />
            <RichText
              label="Meta Description (EN)"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.metaDescriptionEn || ""}
              onChange={(v) => updateSeo("metaDescriptionEn", v)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Meta Keywords"
              icon={Icon.seo("h-4 w-4")}
              placeholder="events,exhibition,kids"
              value={form.seo.metaKeywords || ""}
              onChange={(e) => updateSeo("metaKeywords", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Canonical URL"
              icon={Icon.link("h-4 w-4")}
              placeholder="https://www.futurepark.co.th/…"
              value={form.seo.canonicalUrl || ""}
              onChange={(e) => updateSeo("canonicalUrl", (e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="OG Title"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.ogTitle || ""}
              onChange={(e) => updateSeo("ogTitle", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="OG Description"
              icon={Icon.seo("h-4 w-4")}
              value={form.seo.ogDescription || ""}
              onChange={(e) => updateSeo("ogDescription", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="OG Image URL"
              icon={Icon.image("h-4 w-4")}
              value={form.seo.ogImageUrl || ""}
              onChange={(e) => updateSeo("ogImageUrl", (e.target as HTMLInputElement).value)}
            />

            <div className="grid grid-cols-2 items-center gap-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.seo.robotsNoindex}
                  onChange={(e) => updateSeo("robotsNoindex", e.target.checked)}
                />
              <span className="text-sm">robots: noindex</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.seo.robotsNofollow}
                  onChange={(e) => updateSeo("robotsNofollow", e.target.checked)}
                />
                <span className="text-sm">robots: nofollow</span>
              </label>
            </div>
          </div>

          <label className="grid gap-1">
            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
              {Icon.seo("h-4 w-4")} Structured Data (JSON-LD)
            </span>
            <textarea
              className="inp font-mono text-xs"
              rows={6}
              value={form.seo.structuredData || ""}
              onChange={(e) => updateSeo("structuredData", (e.target as HTMLTextAreaElement).value)}
              placeholder='{"@context":"https://schema.org","@type":"Event","name":"…","startDate":"…"}'
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ACTIONS */}
      <div className="sticky bottom-4 z-10">
        <div className="card shadow-card px-4 py-3 flex items-center justify-between bg-white">
          <button type="button" onClick={onDelete} className="btn btn-outline-zpell">Delete</button>
          <button type="submit" className="btn btn-zpell" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
