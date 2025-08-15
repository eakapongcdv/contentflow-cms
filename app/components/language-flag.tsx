// components/language-flag.tsx
"use client";

export default function LanguageFlag() {
  return (
    <div className="flex gap-1">
      <button className="w-8 h-8 bg-[url('/flags/th.svg')] bg-cover rounded-full" title="TH" />
      <button className="w-8 h-8 bg-[url('/flags/en.svg')] bg-cover rounded-full" title="EN" />
      <button className="w-8 h-8 bg-[url('/flags/cn.svg')] bg-cover rounded-full" title="CN" />
    </div>
  );
}
