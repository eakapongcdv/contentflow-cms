import React from "react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Highlight({
  text,
  tokens,
  className,
}: {
  text?: string | null;
  tokens: string[];
  className?: string;
}) {
  if (!text) return null;
  const tks = tokens.filter(Boolean);
  if (!tks.length) return <span className={className}>{text}</span>;
  const re = new RegExp(`(${tks.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re); // มี delimiter กลับมาด้วย

  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
