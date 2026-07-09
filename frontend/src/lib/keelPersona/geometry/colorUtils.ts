// keel_web/src/lib/keelPersona/geometry/colorUtils.ts

export function glassColorToRgba(color: string, alpha = 0.32): string {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hex;
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  if (color.startsWith("hsl")) {
    const inner = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")"));
    return `hsla(${inner}, ${alpha})`;
  }

  return color;
}
