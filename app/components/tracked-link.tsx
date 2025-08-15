"use client";

export default function TrackedLink({
  href,
  payload,
  className,
  children,
}: {
  href: string;
  payload: { itemType: string; itemId: string; term?: string };
  className?: string;
  children: React.ReactNode;
}) {
  function onClick() {
    try {
      const url = "/api/track-click";
      const data = JSON.stringify(payload);
      if ("sendBeacon" in navigator) {
        const blob = new Blob([data], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
