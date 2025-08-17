// app/admin/(dashboard)/settings/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import WebsiteSwitcher from "./ui/WebsiteSwitcher";
import WebsiteThemeForm from "./ui/WebsiteThemeForm";
import WebsiteStylesForm from "./ui/WebsiteStylesForm"; // ⬅️ เพิ่ม

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const currentId = cookies().get("websiteId")?.value || "";
  const query = new URLSearchParams().toString();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Settings</h1>
        <ButtonGroup>
          <Link href={`/admin/settings?${query}`}>
            <Button variant="dark-outline"  aria-label="Refresh" title="Refresh" leftIcon={<RefreshCw className="h-4 w-4" />}>
              <span className="sr-only">Refresh</span>
            </Button>
          </Link>
        </ButtonGroup>
      </div>

      {/* Website selector */}
      <section className="admin-card p-4">
        <h2 className="text-base font-semibold mb-2 text-white">Current Website</h2>
        <p className="text-sm text-white/60 mb-3">
          เลือกเว็บไซต์ที่ต้องการบริหาร ระบบจะบันทึกลงคุกกี้ <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/80">websiteId</code> และรีเฟรชหน้า
        </p>
        <WebsiteSwitcher initialWebsiteId={currentId} />
      </section>

      {/* Website Config (brand/background) */}
      <section className="admin-card p-4">
        <h2 className="text-base font-semibold mb-3 text-white">Theme</h2>
        <WebsiteThemeForm />
      </section>

      {/* NEW: Stylesheet Template (tokens / CSS) */}
      <section className="admin-card p-4">
        <h2 className="text-base font-semibold mb-3 text-white">Stylesheet</h2>
        <WebsiteStylesForm />
      </section>
    </div>
  );
}
