// app/lib/perm-client.ts
export type Rule = { resource: string; action: string; effect: "ALLOW" | "DENY" };

export function makeCanClient(rules: Rule[]) {
  return (action: string, resource: string) => {
    const scored = rules
      .filter((r) => r.action === "ALL" || r.action === action)
      .filter((r) => {
        if (r.resource === "*") return true;
        if (r.resource.endsWith("*")) return resource.startsWith(r.resource.slice(0, -1));
        return r.resource === resource;
      })
      .map((r) => ({
        r,
        score:
          (r.action === "ALL" ? 0 : 10) +
          (r.resource === "*"
            ? 0
            : r.resource.endsWith("*")
            ? 5 + r.resource.length
            : 20 + r.resource.length),
      }))
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return false;
    const top = scored[0].r;
    return top.effect === "ALLOW";
  };
}
