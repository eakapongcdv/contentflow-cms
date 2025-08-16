"use client";
import PageShell from "@/app/components/PageShell";

export default function SitemapPage() {
  return (
    <PageShell title="Sitemap">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/policy">Privacy Policy</a></li>
        <li><a href="/terms">Terms & Conditions</a></li>
        <li><a href="/pdpa">PDPA & Consent</a></li>
        <li><a href="/security">Security</a></li>
        <li><a href="/about">About us</a></li>
        <li><a href="/contact">Contact us</a></li>
        <li><a href="/careers">Careers</a></li>
        <li><a href="/partners">Partners</a></li>
        <li><a href="/docs">Docs & API</a></li>
      </ul>
    </PageShell>
  );
}
