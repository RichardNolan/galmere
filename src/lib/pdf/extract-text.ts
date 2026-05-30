import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export async function extractTextLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items
      .filter((item): item is Extract<typeof item, { str: string }> => "str" in item)
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: Math.round(item.transform[5]),
      }));

    const grouped: Record<number, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.y]) grouped[item.y] = [];
      grouped[item.y].push(item);
    }

    const pageLines = Object.keys(grouped)
      .sort((a, b) => Number(b) - Number(a))
      .map((y) =>
        grouped[Number(y)]
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(" "),
      );

    lines = lines.concat(pageLines);
  }

  return lines;
}
