"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// ปรับให้ตรงกับ provider id ใน NextAuth ของคุณ
const GOOGLE_PROVIDER_ID = "google";
const MS_PROVIDER_ID = "azure-ad"; // ถ้าใช้ B2C หรือชื่ออื่น ให้เปลี่ยนเป็น "azure-ad-b2c" หรือ id ที่ตั้งไว้

export default function LoginPage() {
  // ✅ ครอบด้วย Suspense เพื่อรองรับ useSearchParams ใน Client Component
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="admin-card p-8 animate-pulse">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/10" />
          <div className="h-6 w-40 mx-auto bg-white/10 rounded mb-2" />
          <div className="h-4 w-56 mx-auto bg-white/10 rounded" />
          <div className="mt-6 space-y-2">
            <div className="h-9 w-full bg-white/10 rounded" />
            <div className="h-9 w-full bg-white/10 rounded" />
          </div>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-white/50">หรือ</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>
          <div className="space-y-2">
            <div className="h-9 w-full bg-white/10 rounded" />
            <div className="h-9 w-full bg-white/10 rounded" />
            <div className="h-9 w-full bg-white/10 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}

function LoginPageInner() {
  const qs = useSearchParams();

  // ถ้ามี callbackUrl จะพากลับหน้านั้น ไม่งั้นไปหน้า overview
  const fallbackUrl = "/admin/";
  const callbackUrl = qs.get("callbackUrl") || fallbackUrl;

  // อ่าน error จาก OAuth (เช่น OAuthAccountNotLinked)
  const oauthError = qs.get("error");
  const oauthMsg = useMemo(() => {
    if (!oauthError) return null;
    switch (oauthError) {
      case "OAuthAccountNotLinked":
        return "อีเมลนี้เคยสมัครด้วยวิธีอื่น กรุณาเข้าสู่ระบบด้วยวิธีเดิมหรือเชื่อมบัญชีในภายหลัง";
      case "AccessDenied":
        return "สิทธิ์ไม่เพียงพอในการเข้าสู่ระบบ";
      default:
        return "ไม่สามารถเข้าสู่ระบบด้วยผู้ให้บริการภายนอกได้";
    }
  }, [oauthError]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingSso, setLoadingSso] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // Prefill email ถ้าเคยติ๊ก Remember me
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin:rememberEmail");
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || loadingSso) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (remember) localStorage.setItem("admin:rememberEmail", email);
      else localStorage.removeItem("admin:rememberEmail");
    } catch {}

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false, // จัดการ redirect เอง
    });

    setLoading(false);

    if (!res || res.error) {
      // ไม่ระบุว่าอีเมลหรือรหัสผ่านผิดส่วนใด
      setErrorMsg("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    // redirect manual
    window.location.href = res.url ?? fallbackUrl;
  }

  function sso(provider: string) {
    if (loading || loadingSso) return;
    setLoadingSso(provider);
    // สำหรับ OAuth/SSO ให้ next-auth redirect เอง
    signIn(provider, { callbackUrl }).finally(() => {
      // ปกติจะ redirect ออกทันที โค้ดนี้เผื่อกรณี popup ถูกบล็อค/เกิด error
      setLoadingSso(null);
    });
  }

  return (
    // ใช้พื้นหลัง/สไตล์จาก app/admin/globals.css (admin-body, grid, glow) ผ่าน layout แล้ว
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="admin-card p-8">
          {/* โลโก้ */}
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,.6)]" />
          <h1 className="text-2xl font-semibold text-center">Sign in</h1>
          <p className="text-sm text-white/70 text-center mt-1">to continue to Admin</p>

          {/* OAuth errors */}
          {oauthMsg && (
            <div className="mt-4 text-sm text-red-400" role="alert" aria-live="polite">
              {oauthMsg}
            </div>
          )}

          {/* SSO buttons */}
          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => sso(GOOGLE_PROVIDER_ID)}
              disabled={!!loadingSso || loading}
              className="admin-btn w-full justify-center gap-2 disabled:opacity-60"
            >
              {/* Google icon (inline SVG) */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="-ml-1">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.3 32.4 29 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16.2 19 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 15.6 4 8.5 8.8 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-4.9l-6-4.9C29 36 26.6 37 24 37c-5 0-9.3-3.2-10.8-7.7l-6.7 5.2C8.7 39.2 15.8 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.4-4.3 6-8.3 6-2.4 0-4.6-.9-6.2-2.4l-6.6 5.1C16.5 39.8 20 41 24 41c9 0 16.5-7.3 16.5-16.5 0-1.3-.1-2.5-.4-3.5z"/>
              </svg>
              {loadingSso === GOOGLE_PROVIDER_ID ? "Connecting…" : "Continue with Google"}
            </button>

            <button
              type="button"
              onClick={() => sso(MS_PROVIDER_ID)}
              disabled={!!loadingSso || loading}
              className="admin-btn w-full justify-center gap-2 disabled:opacity-60"
            >
              {/* Microsoft icon (inline SVG) */}
              <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden className="-ml-1">
                <rect width="10" height="10" x="1" y="1" fill="#F35325"/>
                <rect width="10" height="10" x="12" y="1" fill="#81BC06"/>
                <rect width="10" height="10" x="1" y="12" fill="#05A6F0"/>
                <rect width="10" height="10" x="12" y="12" fill="#FFBA08"/>
              </svg>
              {loadingSso === MS_PROVIDER_ID ? "Connecting…" : "Continue with Microsoft"}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-white/50">หรือ</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {/* Credentials form */}
          <form onSubmit={onSubmit} className="grid gap-3" aria-busy={loading}>
            <label className="text-sm text-white/70" htmlFor="email">Email</label>
            <input
              id="email"
              className="admin-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !!loadingSso}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70" htmlFor="password">Password</label>
              <Link href="/admin/forgot" className="text-sm text-emerald-300 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                className="admin-input pr-24"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!loadingSso}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 hover:text-white"
                aria-pressed={showPw}
                tabIndex={-1}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex items-center justify-between mt-1">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading || !!loadingSso}
                />
                Remember me
              </label>
              <Link href="/" className="text-sm text-white/70 hover:text-white">
                กลับหน้าเว็บ
              </Link>
            </div>

            {(errorMsg || oauthMsg) && (
              <div className="text-sm text-red-400" role="alert" aria-live="polite">
                {errorMsg}
              </div>
            )}

            <button className="admin-btn mt-1 disabled:opacity-60" disabled={loading || !!loadingSso}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/50 mt-4">
          Protected by reCAPTCHA. Privacy Policy & Terms apply.
        </p>
      </div>
    </main>
  );
}
