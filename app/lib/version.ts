// app/lib/version.ts
export function getAppVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("../../package.json");
    return pkg?.version || "dev";
  } catch {
    return "dev";
  }
}
