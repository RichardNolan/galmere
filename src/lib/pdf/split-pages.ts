import { PDFDocument } from "pdf-lib";

export async function splitPdfIntoPages(pdfBytes: Uint8Array, maxPages = 4): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const pageCount = Math.min(sourcePdf.getPageCount(), maxPages);
  const pages: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const singlePdf = await PDFDocument.create();
    const [page] = await singlePdf.copyPages(sourcePdf, [i]);
    singlePdf.addPage(page);
    const bytes = await singlePdf.save();
    pages.push(bytes);
  }

  return pages;
}
