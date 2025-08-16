"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { Code2, SlidersHorizontal, CheckCircle2, AlertTriangle, Clipboard } from "lucide-react";

type CmsTemplate = {
  brand: { logoSrc: string; alt: string };
  background: {
    gradient: string;
    imageSrc: string;
    imageOpacity?: number;
    imageBlendMode?: React.CSSProperties["mixBlendMode"];
    attachment?: "scroll" | "fixed" | "local";
    position?: string;
  };
};

type ApiResp =
  | { error: string }
  | {
      websiteId: string | null;
      name: string | null;
      cmsTemplate: CmsTemplate;
      overrides?: Partial<CmsTemplate>;
      note?: string;
    };

function pretty(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "";
  }
}

export default function WebsiteThemeForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);

  // --- data in Form mode
  const [tpl, setTpl] = useState<CmsTemplate>({
    brand: { logoSrc: "", alt: "" },
    background: {
      gradient: "",
      imageSrc: "",
      imageOpacity: 1,
      imageBlendMode: undefined,
      attachment: "fixed",
      position: "center",
    },
  });

  // --- data in JSON mode
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ui mode
  const [mode, setMode] = useState<"form" | "json">("form");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/website/config", { cache: "no-store" });
        const data: ApiResp = await res.json();
        if ("error" in data) throw new Error(data.error);
        if (!cancelled) {
          setSiteName(data.name || null);
          setTpl(data.cmsTemplate);
          setJsonText(pretty(data.cmsTemplate));
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

  // keep preview style in sync with tpl (form mode only)
  const bgPreviewStyle = useMemo<React.CSSProperties>(() => {
    const bg = tpl.background;
    const layers = [bg.gradient, `url(${bg.imageSrc || ""})`].filter(Boolean).join(", ");
    return {
      backgroundImage: layers || undefined,
      backgroundSize: "cover, cover",
      backgroundRepeat: "no-repeat, no-repeat",
      backgroundPosition: `${bg.position ?? "center"}, ${bg.position ?? "center"}`,
      backgroundAttachment: `${bg.attachment ?? "fixed"}, ${bg.attachment ?? "fixed"}`,
      mixBlendMode: bg.imageBlendMode,
      opacity: bg.imageOpacity ?? 1,
      borderRadius: 12,
      height: 160,
    };
  }, [tpl]);

  // switch modes: when going to JSON, sync current tpl → jsonText; when back to form, parse JSON
  function switchToJSON() {
    setJsonText(pretty(tpl));
    setJsonError(null);
    setMode("json");
  }
  function switchToForm() {
    try {
      const parsed = JSON.parse(jsonText);
      // quick structural guard (optional, keeps it simple)
      if (!parsed?.brand || !parsed?.background) {
        throw new Error("Missing keys: brand/background");
      }
      setTpl(parsed);
      setJsonError(null);
      setMode("form");
    } catch (e: any) {
      setJsonError(e?.message || "Invalid JSON");
    }
  }

  function validateJson() {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed?.brand || !parsed?.background) {
        throw new Error("Missing keys: brand/background");
      }
      setJsonError(null);
      alert("JSON is valid ✔");
    } catch (e: any) {
      setJsonError(e?.message || "Invalid JSON");
    }
  }

  function formatJson() {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(pretty(parsed));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e?.message || "Invalid JSON");
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(jsonText);
      alert("Copied to clipboard");
    } catch {
      /* no-op */
    }
  }

  const onSave = async () => {
    try {
      setSaving(true);
      setErr(null);
      let payload: CmsTemplate;
      if (mode === "json") {
        // guard parse
        const parsed = JSON.parse(jsonText);
        if (!parsed?.brand || !parsed?.background) {
          throw new Error("Missing keys: brand/background");
        }
        payload = parsed as CmsTemplate;
      } else {
        payload = tpl;
      }

      const res = await fetch("/api/admin/website/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmsTemplate: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      // sync both modes with saved, pretty-printed
      setTpl(data.cmsTemplate);
      setJsonText(pretty(data.cmsTemplate));
      setJsonError(null);
      alert("Saved.");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">
          Website Config (brand & background)
          {siteName ? (
            <>
              {" "}
              — <span className="font-normal">{siteName}</span>
            </>
          ) : null}
        </h3>

        <ButtonGroup>
          {mode === "form" ? (
            <Button variant="outlineZspell" onClick={switchToJSON} leftIcon={<Code2 className="h-4 w-4" />}>
              JSON View
            </Button>
          ) : (
            <Button variant="outlineZspell" onClick={switchToForm} leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
              Form View
            </Button>
          )}
          <Button variant="zspell" onClick={onSave} loading={saving} disabled={loading}>
            Save Changes
          </Button>
        </ButtonGroup>
      </div>

      {err ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{err}</div>
      ) : null}

      {/* MODE: FORM */}
      {mode === "form" ? (
        <div className="grid gap-4">
          {/* Brand */}
          <section className="admin-card p-4">
            <h4 className="font-medium mb-3 text-white">Brand</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Logo Src (path under /public)</span>
                <input
                  className="admin-input"
                  value={tpl.brand.logoSrc}
                  onChange={(e) => setTpl((s) => ({ ...s, brand: { ...s.brand, logoSrc: e.target.value } }))}
                  placeholder="/images/logo.svg"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Logo Alt</span>
                <input
                  className="admin-input"
                  value={tpl.brand.alt}
                  onChange={(e) => setTpl((s) => ({ ...s, brand: { ...s.brand, alt: e.target.value } }))}
                  placeholder="Content management system v1.0"
                />
              </label>
            </div>
          </section>

          {/* Background */}
          <section className="admin-card p-4">
            <h4 className="font-medium mb-3 text-white">Background</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Gradient (CSS)</span>
                <input
                  className="admin-input font-mono"
                  value={tpl.background.gradient}
                  onChange={(e) => setTpl((s) => ({ ...s, background: { ...s.background, gradient: e.target.value } }))}
                  placeholder='linear-gradient(#fff,#f0fff9)'
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Image Src (path under /public)</span>
                <input
                  className="admin-input"
                  value={tpl.background.imageSrc}
                  onChange={(e) => setTpl((s) => ({ ...s, background: { ...s.background, imageSrc: e.target.value } }))}
                  placeholder="/images/background_image.png"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Image Opacity (0..1)</span>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  className="admin-input"
                  value={tpl.background.imageOpacity ?? 1}
                  onChange={(e) =>
                    setTpl((s) => ({
                      ...s,
                      background: { ...s.background, imageOpacity: Number(e.target.value) },
                    }))
                  }
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Image Blend Mode</span>
                <select
                  className="admin-input"
                  value={(tpl.background.imageBlendMode as string) || ""}
                  onChange={(e) =>
                    setTpl((s) => ({
                      ...s,
                      background: { ...s.background, imageBlendMode: (e.target.value || undefined) as any },
                    }))
                  }
                >
                  <option value="">(none)</option>
                  <option value="multiply">multiply</option>
                  <option value="screen">screen</option>
                  <option value="overlay">overlay</option>
                  <option value="darken">darken</option>
                  <option value="lighten">lighten</option>
                  <option value="color-burn">color-burn</option>
                  <option value="color-dodge">color-dodge</option>
                  <option value="difference">difference</option>
                  <option value="exclusion">exclusion</option>
                  <option value="hard-light">hard-light</option>
                  <option value="soft-light">soft-light</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Attachment</span>
                <select
                  className="admin-input"
                  value={tpl.background.attachment ?? "fixed"}
                  onChange={(e) =>
                    setTpl((s) => ({ ...s, background: { ...s.background, attachment: e.target.value as any } }))
                  }
                >
                  <option value="scroll">scroll</option>
                  <option value="fixed">fixed</option>
                  <option value="local">local</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Position</span>
                <input
                  className="admin-input"
                  value={tpl.background.position ?? "center"}
                  onChange={(e) => setTpl((s) => ({ ...s, background: { ...s.background, position: e.target.value } }))}
                  placeholder="center"
                />
              </label>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60 mb-1">Preview</div>
              <div className="w-full border border-white/10 overflow-hidden" style={bgPreviewStyle} />
            </div>
          </section>
        </div>
      ) : null}

      {/* MODE: JSON */}
      {mode === "json" ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm text-white/80">
              <Code2 className="h-4 w-4 text-zpell" />
              <span>Text View (JSON)</span>
              {jsonError ? (
                <span className="inline-flex items-center gap-1 text-red-300">
                  <AlertTriangle className="h-4 w-4" /> {jsonError}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Valid
                </span>
              )}
            </div>
            <ButtonGroup>
              <Button variant="outlineZspell" onClick={copyJson} leftIcon={<Clipboard className="h-4 w-4" />}>
                Copy
              </Button>
              <Button variant="outlineZspell" onClick={validateJson}>
                Validate
              </Button>
              <Button variant="outlineZspell" onClick={formatJson}>
                Format
              </Button>
            </ButtonGroup>
          </div>

          <textarea
            className="admin-input font-mono text-[12.5px] leading-5 min-h-[280px]"
            rows={18}
            spellCheck={false}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              // lazy validate: clear error on typing
              if (jsonError) setJsonError(null);
            }}
            placeholder={`{
  "brand": { "logoSrc": "/images/logo.svg", "alt": "Content management system v1.0" },
  "background": {
    "gradient": "linear-gradient(...)",
    "imageSrc": "/images/background_image.png",
    "imageOpacity": 1,
    "imageBlendMode": "multiply",
    "attachment": "fixed",
    "position": "center"
  }
}`}
          />
          <p className="text-xs text-white/60">
            * วาง/แก้ไขค่าได้โดยตรงในรูปแบบ JSON แล้วกด <b>Save Changes</b> หรือสลับกลับไป <b>Form View</b>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
