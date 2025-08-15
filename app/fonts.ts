// app/fonts.ts
import localFont from "next/font/local";

export const dbx = localFont({
  src: [
    {
      path: "./fonts/dbx/DB Helvethaica X.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-dbthai",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});
