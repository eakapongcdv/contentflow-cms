"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setMsg("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("ตั้งรหัสผ่านใหม่สำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...");
      setTimeout(() => router.push("/admin/login"), 1200);
    } else {
      const data = await res.json().catch(() => null);
      setMsg(data?.error ?? "ลิงก์หมดอายุหรือไม่ถูกต้อง");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <h1 className="text-xl font-semibold text-center">Reset your password</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="label">Confirm new password</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {msg && <div className="text-sm text-emerald-700">{msg}</div>}
          <button className="btn btn-primary mt-2" disabled={loading}>
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
