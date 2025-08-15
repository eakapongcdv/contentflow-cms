// app/admin/(dashboard)/website-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";

type Website = {
  id: string;
  name: string;
  template: string;
  primaryDomain?: string | null;
  locales: string[];
  defaultLocale?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  theme?: any;
  settings?: any;
};

type WebsiteContextType = {
  websiteId?: string;
  setWebsiteId: (id: string) => void;
  website?: Website;
  websites: Website[];
  loading: boolean;
};

const WebsiteContext = createContext<WebsiteContextType>({
  websiteId: undefined,
  setWebsiteId: () => {},
  website: undefined,
  websites: [],
  loading: true,
});

export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const [websiteId, setWebsiteIdState] = useState<string | undefined>(undefined);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [website, setWebsite] = useState<Website | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // โหลด websites ทั้งหมด
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/websites", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setWebsites(data.items ?? []);
      } catch (err) {
        console.error("Load websites failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // โหลด websiteId จาก localStorage หรือ cookie
  useEffect(() => {
    const fromLocal = localStorage.getItem("websiteId");
    const fromCookie = Cookies.get("websiteId");
    if (fromLocal) {
      setWebsiteIdState(fromLocal);
    } else if (fromCookie) {
      setWebsiteIdState(fromCookie);
    }
  }, []);

  const setWebsiteId = (id: string) => {
    setWebsiteIdState(id);
    localStorage.setItem("websiteId", id);
    Cookies.set("websiteId", id, { sameSite: "lax", path: "/" });
    // trigger reload ให้ API ทั้งหมดอ่านค่าใหม่
    location.reload();
  };

  // อัปเดต website ปัจจุบันตาม websiteId
  useEffect(() => {
    if (!websiteId) {
      setWebsite(undefined);
      return;
    }
    const found = websites.find((w) => w.id === websiteId);
    setWebsite(found);
  }, [websiteId, websites]);

  const value = useMemo(
    () => ({
      websiteId,
      setWebsiteId,
      website,
      websites,
      loading,
    }),
    [websiteId, website, websites, loading]
  );

  return (
    <WebsiteContext.Provider value={value}>
      {children}
    </WebsiteContext.Provider>
  );
}

export const useWebsite = () => useContext(WebsiteContext);
