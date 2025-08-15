// app/cms.config.ts
export type CmsTemplate = {
  brand: {
    logoSrc: string;  // path จาก /public
    alt: string;
  };
  background: {
    /** พื้นหลังไล่เฉด */
    gradient: string;
    /** รูปพื้นหลังแบบยืดเต็มจอ (อ่านจาก /public) */
    imageSrc: string;
    /** ตัวเลือกเสริม */
    imageOpacity?: number;   // 0..1
    imageBlendMode?: React.CSSProperties["mixBlendMode"];
    attachment?: "scroll" | "fixed" | "local";
    position?: string;       // eg. "center"
  };
};

export const cmsTemplate: CmsTemplate = {
  brand: {
    logoSrc: "/images/logo.svg",           // ✅ วางไฟล์ไว้ที่ public/logo.png
    alt: "Content management system v1.0",
  },
  background: {
    // ✅ Gradient ตามที่ขอ
    gradient:
      "linear-gradient(rgb(213, 243, 237) 30%, rgba(229, 255, 250, 0.6) 54%, rgb(240, 255, 252) 100%)",
    imageSrc: "/images/background_image.png", // ✅ วางไฟล์ไว้ที่ public/background_image.png
    imageOpacity: 1,
    imageBlendMode: undefined,         // ตั้งค่าได้ เช่น "multiply"
    attachment: "fixed",
    position: "center",
  },
};

// ---------- Helper styles (สะดวกใช้ใน BackgroundLayer) ----------
export function buildBackgroundStyle(): React.CSSProperties {
  const bg = cmsTemplate.background;
  return {
    backgroundImage: `${bg.gradient}, url(${bg.imageSrc})`,
    backgroundSize: "cover, cover",
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundPosition: `${bg.position ?? "center"}, ${bg.position ?? "center"}`,
    backgroundAttachment: `${bg.attachment ?? "fixed"}, ${bg.attachment ?? "fixed"}`,
  };
}
