"use client";
import PageShell from "@/app/components/PageShell";

export default function PdpaPage() {
  return (
    <PageShell title="PDPA & Consent">
      <p>อธิบายการจัดการความยินยอม (Consent) การบันทึกหลักฐาน (Consent Log) และสิทธิ DSR...</p>
      <h2>Cookie/Consent Banner</h2>
      <p>รูปแบบแบนเนอร์ ตัวเลือก และการปิดการติดตามแบบไม่ระบุตัวตน...</p>
      <h2>Data Subject Request (DSR)</h2>
      <p>วิธีการยื่นคำขอ การยืนยันตัวตน ระยะเวลาดำเนินการ...</p>
    </PageShell>
  );
}
