import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";
import {
  analyzeWithAzureOcr,
  assessBatchRecordQuality,
  assessLabCertQuality,
  extractTextLines,
  parseAzureNutritionTables,
  parseBatchHeader,
  parseNutritionFromText,
  parseRecipeRows,
  type AzureAnalyzeResult,
  type ExtractionResult,
  type LabCertResult,
  type ProgressUpdate,
} from "#/lib/pdf";
import { supabase } from "#/lib/supabase";
import { cn } from "#/lib/utils";
import { FileUp, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type PdfExtractorProps = {
  extractionType: "lab-cert" | "batch-record";
  onResult: (result: ExtractionResult) => void;
  onError?: (error: Error) => void;
  maxPages?: number;
  skipUpload?: boolean;
  supabaseBucket?: string;
  supabaseFolder?: string;
  triggerLabel?: string;
};

const stageLabels: Record<ProgressUpdate["stage"], string> = {
  uploading: "Uploading PDF…",
  "extracting-text": "Extracting text…",
  assessing: "Assessing text quality…",
  "ocr-submitting": "Submitting to OCR…",
  "ocr-polling": "Processing with Azure OCR…",
  parsing: "Parsing results…",
  complete: "Complete",
};

const FULL_TEXT_PREVIEW_LIMIT = 1000;

export function PdfExtractor({
  extractionType,
  onResult,
  onError,
  maxPages = 4,
  skipUpload = false,
  supabaseBucket = "pdfs",
  supabaseFolder,
  triggerLabel = "Upload PDF",
}: PdfExtractorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fullTextPreview, setFullTextPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const folder = supabaseFolder ?? (extractionType === "lab-cert" ? "lab-certs" : "batch-records");

  const updateProgress = useCallback((stage: ProgressUpdate["stage"], percent: number) => {
    setProgress({ stage, percent, message: stageLabels[stage] });
  }, []);

  const uploadToSupabase = useCallback(
    async (file: File) => {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${folder}/${timestamp}-${safeName}`;

      const { error } = await supabase.storage.from(supabaseBucket).upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      const { data: urlData } = supabase.storage.from(supabaseBucket).getPublicUrl(storagePath);

      return { url: urlData.publicUrl, path: storagePath };
    },
    [supabaseBucket, folder],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        onError?.(new Error("Please select a PDF file"));
        return;
      }

      setFullTextPreview("");

      try {
        // 1. Optionally upload to Supabase
        let fileUrl: string | undefined;
        if (!skipUpload) {
          updateProgress("uploading", 10);
          const uploaded = await uploadToSupabase(file);
          fileUrl = uploaded.url;
        }

        // 2. Extract text from PDF
        updateProgress("extracting-text", 25);
        const lines = await extractTextLines(file);
        const fullText = lines.join("\n");
        setFullTextPreview(fullText.slice(0, FULL_TEXT_PREVIEW_LIMIT));

        // 3. Assess text quality
        updateProgress("assessing", 35);

        if (extractionType === "batch-record") {
          // Batch records always use text extraction
          if (!assessBatchRecordQuality(fullText)) {
            throw new Error(
              "Could not find RM/WIP codes or percentages in this PDF. Please check the file is a batch record.",
            );
          }

          updateProgress("parsing", 75);
          const rows = parseRecipeRows(lines);
          const header = parseBatchHeader(lines);

          updateProgress("complete", 100);
          onResult({
            type: "batch-record",
            method: "text-extraction",
            fileUrl,
            fileName: file.name,
            rows,
            header,
          });
          setIsOpen(false);
        } else {
          // Lab certs: try text first, fall back to OCR
          let certs: LabCertResult[];

          if (assessLabCertQuality(fullText)) {
            updateProgress("parsing", 60);
            // Text extraction sufficient — parse each page's text
            const cert = parseNutritionFromText(fullText);
            certs = [cert];

            updateProgress("complete", 100);
            onResult({
              type: "lab-cert",
              method: "text-extraction",
              fileUrl,
              fileName: file.name,
              certs,
            });
            setIsOpen(false);
          } else {
            // Fall back to Azure OCR
            updateProgress("ocr-submitting", 40);
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            // Convert to base64 for server transport
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const pdfBase64 = btoa(binary);

            updateProgress("ocr-polling", 55);
            const callAnalyzeWithAzureOcr = analyzeWithAzureOcr as unknown as (input: {
              data: { pdfBase64: string; maxPages?: number };
            }) => Promise<{ certResults: AzureAnalyzeResult[] }>;
            const ocrResult = await callAnalyzeWithAzureOcr({
              data: { pdfBase64, maxPages },
            });

            updateProgress("parsing", 85);
            certs = ocrResult.certResults.map((result, index) => {
              const tables = result.analyzeResult?.tables;
              if (tables?.length) {
                return parseAzureNutritionTables(tables);
              }
              return {
                labNumber: `195910${index + 1}`,
                nutrition: {
                  kj: "",
                  kcal: "",
                  fat: "",
                  sat: "",
                  carbs: "",
                  sugar: "",
                  fibre: "",
                  protein: "",
                  salt: "",
                },
              };
            });

            updateProgress("complete", 100);
            onResult({
              type: "lab-cert",
              method: "azure-ocr",
              fileUrl,
              fileName: file.name,
              certs,
            });
            setIsOpen(false);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("PDF extraction failed");
        onError?.(error);
      } finally {
        setProgress(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [extractionType, maxPages, onResult, onError, skipUpload, updateProgress, uploadToSupabase],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const isProcessing = progress !== null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] max-w-xl bg-white p-0">
        <SheetHeader className="border-b border-zinc-200 px-5 py-4">
          <SheetTitle>
            {extractionType === "lab-cert" ? "Lab Certificate Upload" : "Batch Record Upload"}
          </SheetTitle>
          <SheetDescription>
            {extractionType === "lab-cert"
              ? "Upload a lab nutrition certificate PDF to extract nutrition values."
              : "Upload a batch production record PDF to extract recipe rows."}
          </SheetDescription>
        </SheetHeader>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-5">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300",
                isProcessing && "pointer-events-none opacity-60",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-slate-700">{progress.message}</p>
                  <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <FileUp className="size-8 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    Drag and drop a PDF here, or click to browse
                  </p>
                  <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    Choose file
                  </Button>
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </div>

            {fullTextPreview ? (
              <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Extracted text preview
                </p>
                <div className="max-h-28 overflow-y-auto rounded border border-zinc-200 bg-white p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-700">
                  {fullTextPreview}
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Showing up to {FULL_TEXT_PREVIEW_LIMIT.toLocaleString()} characters.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}
