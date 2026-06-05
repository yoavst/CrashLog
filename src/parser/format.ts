/** Small shared helpers used by both parsers. */

/** Format a number as a zero-padded, 0x-prefixed hex address. Addresses are
 * 40-bit on arm64, so 10 hex digits is the natural width. */
export function toHexAddress(value: number, width = 10): string {
  if (!Number.isFinite(value)) return "0x0";
  const hex = Math.trunc(value).toString(16);
  return "0x" + hex.padStart(width, "0");
}

/** Parse a hex or decimal string into a number, tolerating `0x` prefixes. */
export function parseAddress(text: string | number | undefined): number {
  if (typeof text === "number") return text;
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return Number.parseInt(trimmed.slice(2), 16) || 0;
  }
  return Number.parseInt(trimmed, 10) || 0;
}

/** Best-effort extraction of a file's basename. */
export function basename(path: string | undefined): string {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

/** Human-readable byte size. */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
