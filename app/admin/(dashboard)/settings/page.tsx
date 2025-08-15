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
        <h1 className="text-xl font-semibold">Settings</h1>
        <ButtonGroup>
          <Link href={`/admin/settings?${query}`}>
            <Button variant="outlineZspell" aria-label="Refresh" title="Refresh" leftIcon={<RefreshCw className="h-4 w-4" />}>
              <span className="sr-only">Refresh</span>
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="zspell" aria-label="Back to Dashboard" title="Back to Dashboard" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
        </ButtonGroup>
      </div>

      {/* Website selector */}
      <section className="card p-4">
        <h2 className="text-base font-semibold mb-2">Current Website</h2>
        <p className="text-sm text-gray-600 mb-3">
          เลือกเว็บไซต์ที่ต้องการบริหาร ระบบจะบันทึกลงคุกกี้ <code>websiteId</code> และรีเฟรชหน้า
        </p>
        <WebsiteSwitcher initialWebsiteId={currentId} />
      </section>

      {/* Website Config (brand/background) */}
      <section className="card p-4">
        <WebsiteThemeForm />
      </section>

      {/* NEW: Stylesheet Template (tokens / CSS) */}
      <section className="card p-4">
        <WebsiteStylesForm />
      </section>
    </div>
  );
}
