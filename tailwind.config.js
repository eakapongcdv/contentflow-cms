/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./styles/**/*.{css}",
    // ถ้ามี src/ ก็ใส่เพิ่มได้:
    // "./src/**/*.{ts,tsx}"
  ],
  theme: { 
    extend: { 
      fontFamily: {
        // ใช้ฟอนต์ DB เป็นตัวแรก แล้วตามด้วยชุด default ของ Tailwind
        sans: ["var(--font-dbthai)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: { mint:"#dbf4ef", green:"#c0eadf", dark:"#0b2c2b" }
      },
      boxShadow: {
        card:"0 10px 20px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: [require("@tailwindcss/line-clamp")],
};
