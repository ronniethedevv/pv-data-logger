import { toPng } from "html-to-image";

/**
 * Capture a chart card as a PNG and trigger a browser download.
 *
 * Rendered at 2x device pixel ratio on a white background so the export is
 * crisp. Nodes flagged with `data-export-ignore` (e.g. the download button
 * itself) are excluded from the capture.
 */
export async function downloadChart(node: HTMLElement, slug: string): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    filter: (el) => !(el instanceof HTMLElement && el.dataset.exportIgnore === "true"),
  });
  const link = document.createElement("a");
  link.download = `${slug}-${formatTimestamp(Date.now())}.png`;
  link.href = dataUrl;
  link.click();
}

/** Build the `YYYYMMDD-HHmm` stamp used in exported chart filenames. */
function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
