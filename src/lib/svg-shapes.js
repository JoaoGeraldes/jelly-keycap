/** Reads the shapes out of an SVG file, so a canvas can draw the logo from the same file the app shows. */

/** The `d` of every <path>, in order: what `new Path2D(d)` needs to draw it. */
export function pathShapes(svgText) {
  return [...svgText.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((match) => match[1]);
}
