// app/admin/(dashboard)/settings/ui/WebsiteStylesForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import {
  Paintbrush,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Eraser,
  Palette,
} from "lucide-react";

type Tokens = {
  primary: string;
  navy: string;
  link: string;
  bg: string;
  surface: string;
  muted: string;
  darkBg: string;
  darkSurface: string;
  darkMuted: string;
};

type StylePayload = {
  mode: "tokens" | "css";
  templateName: string;
  tokens: Tokens;
  rawCss: string;
};

type ApiResp =
  | { error: string }
  | {
      websiteId: string | null;
      name?: string | null;
      style: StylePayload;
      defaults: { tokens: Tokens; rawCss: string };
      note?: string;
    };

const PRESETS: Array<{ name: string; tokens: Partial<Tokens> }> = [
  {
    name: "Zpell (Default)",
    tokens: {},
  },
  {
    name: "Emerald Deep",
    tokens: {
      primary: "#059669",
      navy: "#083344",
      link: "#065f46",
    },
  },
  {
    name: "Navy & Mint",
    tokens: {
      primary: "#2dd4bf",
      navy: "#0f172a",
      link: "#334155",
      darkBg: "#0b1220",
      darkSurface: "#0f172a",
      darkMuted: "#94a3b8",
    },
  },
  {
    name: "Orchid",
    tokens: {
      primary: "#9b5de5",
      navy: "#231942",
      link: "#6d597a",
    },
  },
];

function cssFromTokens(t: Tokens) {
  return `:root{
  --zp-primary: ${t.primary};
  --zp-navy: ${t.navy};
  --zp-link: ${t.link};
  --zp-bg: ${t.bg};
  --zp-surface: ${t.surface};
  --zp-muted: ${t.muted};
}
@media (prefers-color-scheme: dark){
  :root{
    --zp-bg:${t.darkBg};
    --zp-surface:${t.darkSurface};
    --zp-muted:${t.darkMuted};
  }
}`.trim();
}

export default function WebsiteStylesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);

  const [style, setStyle] = useState<StylePayload>({
    mode: "tokens",
    templateName: "Custom",
    tokens: {
      primary: "#34bcb1",
      navy: "#0f2d53",
      link: "#6d6d6d",
      bg: "#ffffff",
      surface: "#ffffff",
      muted: "#6b7280",
      darkBg: "#0b1424",
      darkSurface: "#0f1b31",
      darkMuted: "#92a0b5",
    },
    rawCss: "",
  });

  const [defaults, setDefaults] = useState<{ tokens: Tokens; rawCss: string } | null>(null);

  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/website/stylesheet", { cache: "no-store" });
        const data: ApiResp = await res.json();
        if ("error" in data) throw new Error(data.error);
        if (!cancelled) {
          setSiteName(data.name || null);
          setStyle(data.style);
          setDefaults(data.defaults);
          setErr(null);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveCss = useMemo(() => {
    return style.mode === "css" ? style.rawCss : cssFromTokens(style.tokens);
  }, [style]);

  async function onSave() {
    try {
      setSaving(true);
      setErr(null);
      const res = await fetch("/api/admin/website/stylesheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(style),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Save failed");
      alert("Saved.");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(name: string) {
    const p = PRESETS.find((x) => x.name === name);
    if (!p) return;
    setStyle((s) => ({
      ...s,
      templateName: name,
      tokens: { ...s.tokens, ...(p.tokens as any) },
    }));
  }

  function resetToDefaults() {
    if (!defaults) return;
    setStyle((s) => ({
      mode: "tokens",
      templateName: "Zpell (Default)",
      tokens: { ...defaults.tokens },
      rawCss: defaults.rawCss,
    }));
  }

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Stylesheet Template {siteName ? <> — <span className="font-normal">{siteName}</span></> : null}
        </h3>
        <ButtonGroup>
          <Button
            variant="outlineZspell"
            onClick={() => setShowPreview((v) => !v)}
            leftIcon={showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outlineZspell" onClick={resetToDefaults} leftIcon={<Eraser className="h-4 w-4" />}>
            Reset to Defaults
          </Button>
          <Button variant="zspell" onClick={onSave} loading={saving} disabled={loading}>
            Save Changes
          </Button>
        </ButtonGroup>
      </div>

      {err ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      {/* MODE SWITCH */}
      <div className="card p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Mode:</span>
          <ButtonGroup>
            <Button
              variant={style.mode === "tokens" ? "zspell" : "outlineZspell"}
              onClick={() => setStyle((s) => ({ ...s, mode: "tokens" }))}
              leftIcon={<Palette className="h-4 w-4" />}
            >
              Form (Tokens)
            </Button>
            <Button
              variant={style.mode === "css" ? "zspell" : "outlineZspell"}
              onClick={() => setStyle((s) => ({ ...s, mode: "css" }))}
              leftIcon={<Code2 className="h-4 w-4" />}
            >
              Text Editor (CSS)
            </Button>
          </ButtonGroup>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Preset:</span>
          <select
            className="inp w-56"
            value={style.templateName}
            onChange={(e) => applyPreset(e.target.value)}
          >
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FORM MODE (TOKENS) */}
      {style.mode === "tokens" ? (
        <section className="card p-4 grid gap-4">
          <h4 className="font-medium">Theme Tokens</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(
              [
                ["primary", "Primary (brand)"],
                ["navy", "Navy (deep)"],
                ["link", "Link"],
                ["bg", "Background"],
                ["surface", "Surface"],
                ["muted", "Muted text"],
                ["darkBg", "Dark: Background"],
                ["darkSurface", "Dark: Surface"],
                ["darkMuted", "Dark: Muted text"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid gap-1">
                <span className="text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-md border"
                    value={(style.tokens as any)[key]}
                    onChange={(e) =>
                      setStyle((s) => ({ ...s, tokens: { ...s.tokens, [key]: e.target.value } }))
                    }
                    aria-label={`${label} color`}
                  />
                  <input
                    className="inp"
                    value={(style.tokens as any)[key]}
                    onChange={(e) =>
                      setStyle((s) => ({ ...s, tokens: { ...s.tokens, [key]: e.target.value } }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* CSS MODE (TEXTAREA) */}
      {style.mode === "css" ? (
        <section className="card p-4 grid gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Code2 className="h-4 w-4 text-zpell" />
            <span>Custom CSS</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 ml-2">
              <CheckCircle2 className="h-4 w-4" /> Variables only is fine — full CSS also supported.
            </span>
          </div>
          <textarea
            className="inp font-mono text-[12.5px] leading-5"
            rows={18}
            spellCheck={false}
            value={style.rawCss}
            onChange={(e) => setStyle((s) => ({ ...s, rawCss: e.target.value }))}
            placeholder={`:root{ --zp-primary:#34bcb1; /* ... */ }`}
          />
        </section>
      ) : null}

      {/* LIVE PREVIEW */}
      {showPreview ? (
        <section className="card p-4">
          <style dangerouslySetInnerHTML={{ __html: effectiveCss }} />
          <div className="text-xs text-gray-500 mb-3">Live Preview</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ background: "var(--zp-surface)" }}>
              <h5 className="font-semibold text-[15px]" style={{ color: "var(--zp-navy)" }}>
                Card Title
              </h5>
              <p className="text-sm" style={{ color: "var(--zp-muted)" }}>
                This is a paragraph using the current theme tokens. Links look like{" "}
                <a style={{ color: "var(--zp-link)" }} href="#">
                  this
                </a>
                .
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="zspell">Primary</Button>
                <Button variant="outlineZspell">Outline</Button>
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ background: "var(--zp-bg)" }}>
              <div className="chip chip-emerald">chip-emerald</div>{" "}
              <div className="chip chip-sky">chip-sky</div>{" "}
              <div className="chip chip-gray">chip-gray</div>
              <div className="mt-3">
                <input className="inp" placeholder="Input…" />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
