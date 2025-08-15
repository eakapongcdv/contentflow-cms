// app/components/BackgroundLayer.tsx
"use client";

import * as React from "react";
import type { CmsTemplate } from "@/app/cms.config";

export default function BackgroundLayer({ template }: { template: CmsTemplate }) {
  const bg = template.background;
  const style: React.CSSProperties = {
    backgroundImage: `${bg.gradient}, url(${bg.imageSrc})`,
    backgroundSize: "cover, cover",
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundPosition: `${bg.position ?? "center"}, ${bg.position ?? "center"}`,
    backgroundAttachment: `${bg.attachment ?? "fixed"}, ${bg.attachment ?? "fixed"}`,
    mixBlendMode: bg.imageBlendMode,
    opacity: bg.imageOpacity ?? 1,
  };
  return <div aria-hidden className="fixed inset-0 -z-10" style={style} />;
}
