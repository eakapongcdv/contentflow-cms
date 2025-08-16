"use client";
import PageShell from "@/app/components/PageShell";

export default function SecurityPage() {
  return (
    <PageShell title="Security">
      <p>สรุปมาตรการความปลอดภัย: RBAC, การเข้ารหัสพัก/ส่ง, สำรองข้อมูล, Logging/Monitoring...</p>
      <h2>มาตรฐานอ้างอิง</h2>
      <ul>
        <li>ISO/IEC 27001 Controls</li>
        <li>SOC 2 (Trust Services Criteria)</li>
        <li>OWASP ASVS / Secure SDLC</li>
      </ul>
      <h2>Responsible Disclosure</h2>
      <p>ช่องทางแจ้งช่องโหว่และการตอบสนองต่อเหตุการณ์ (Incident Response)</p>
    </PageShell>
  );
}
