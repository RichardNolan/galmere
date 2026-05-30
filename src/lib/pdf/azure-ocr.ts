import { createServerFn } from "@tanstack/react-start";
import { PDFDocument } from "pdf-lib";
import type { AzureAnalyzeResult } from "./types";

async function submitPageToAzure(
  pdfBytes: Uint8Array,
  endpoint: string,
  apiKey: string,
): Promise<string> {
  const url = `${endpoint}documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/pdf",
    },
    body: pdfBytes as unknown as BodyInit,
  });

  if (!response.ok) {
    throw new Error(`Azure OCR submission failed: ${response.status} ${response.statusText}`);
  }

  const operationLocation = response.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("Azure OCR did not return an operation-location header");
  }

  return operationLocation;
}

async function pollForResult(operationUrl: string, apiKey: string): Promise<AzureAnalyzeResult> {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = await fetch(operationUrl, {
      headers: { "Ocp-Apim-Subscription-Key": apiKey },
    });

    if (!response.ok) {
      throw new Error(`Azure OCR polling failed: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as AzureAnalyzeResult;

    if (result.status === "succeeded") return result;
    if (result.status === "failed") throw new Error("Azure Document Intelligence analysis failed");
  }

  throw new Error("Azure OCR timed out after 30 seconds");
}

export const analyzeWithAzureOcr = createServerFn({
  method: "POST",
}).handler(async (ctx) => {
  const data = (ctx as { data?: { pdfBase64: string; maxPages?: number } }).data;

  if (!data?.pdfBase64) {
    throw new Error("Missing pdfBase64 payload for OCR analysis");
  }

  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Azure Document Intelligence credentials not configured");
  }

  const pdfBytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));

  const sourcePdf = await PDFDocument.load(pdfBytes);
  const pageCount = Math.min(sourcePdf.getPageCount(), data.maxPages ?? 4);

  const pages: Uint8Array[] = [];
  for (let i = 0; i < pageCount; i++) {
    const singlePdf = await PDFDocument.create();
    const [page] = await singlePdf.copyPages(sourcePdf, [i]);
    singlePdf.addPage(page);
    pages.push(await singlePdf.save());
  }

  // Submit all pages in parallel
  const operationUrls = await Promise.all(
    pages.map((pageBytes) => submitPageToAzure(pageBytes, endpoint, apiKey)),
  );

  // Poll all operations concurrently
  const results = await Promise.all(operationUrls.map((url) => pollForResult(url, apiKey)));

  return { certResults: results };
});
