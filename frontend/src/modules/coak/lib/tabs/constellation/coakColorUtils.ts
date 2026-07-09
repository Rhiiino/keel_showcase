// keel_web/src/modules/coak/lib/tabs/constellation/coakColorUtils.ts

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return "#06B6D4";
}
