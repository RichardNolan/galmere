# PDF Extraction & OCR Pipeline — Technical Migration Spec

> **Purpose**: Self-contained specification to reproduce the Galmere App's PDF extraction pipeline in a TanStack Start + React application, with Supabase file storage and a smart orchestrator that tries text extraction first and falls back to Azure Document Intelligence OCR only when needed.

---

## 1. Overview of Current System

The existing app has **two distinct PDF extraction flows** that share a common server-side Azure OCR endpoint:

| Flow                           | Input PDF                                                         | Extraction Method                                           | Output                                                                                            |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Lab Nutrition Certificates** | Multi-page PDF with nutrition analysis tables (one cert per page) | Server-side Azure Document Intelligence OCR → table parsing | 9 nutrition values per cert (kJ, kcal, fat, sat, carbs, sugar, fibre, protein, salt) + lab number |
| **Batch Record Recipes**       | Batch production record PDF                                       | Client-side pdf.js text extraction (no OCR)                 | Array of recipe rows (RM code, ingredient name, %) + batch header (code, name, date)              |

### Key Insight for Optimisation

The batch record flow already proves that **client-side text extraction works for text-layer PDFs**. The lab cert flow always sends to Azure OCR even when the PDF may have extractable text. The new system should:

1. Attempt client-side text extraction first (pdf.js)
2. Analyse whether extracted text contains usable nutrition table data
3. Only fall back to Azure OCR when text extraction fails or yields insufficient data

---

## 2. Credentials & Environment Variables

### Azure Document Intelligence

- **Service**: Azure AI Document Intelligence (formerly Form Recognizer)
- **Model used**: `prebuilt-layout` (table extraction)
- **API version**: `2024-02-29-preview`
- **Rate limiting**: The current code processes pages sequentially with 1.5s polling intervals. The API is async — you submit a document, get an `operation-location` URL, then poll until status is `succeeded`.

> ⚠️ **Security note**: Rotate this key before production deployment. It should only ever live in server-side environment variables, never exposed to the client.

---

## 3. Architecture — Current vs New

### Current Architecture

```
Browser                          Express Server (server.js)
  │                                     │
  ├─ Lab Cert PDF ──────────────────────┤
  │   sendPdfToAzure() ──► POST /api/azure-ocr
  │   (FormData upload)                 │
  │                                     ├─ Split PDF into individual pages (pdf-lib)
  │                                     ├─ Send each page to Azure Doc Intelligence
  │                                     ├─ Poll for results (up to 20 attempts × 1.5s)
  │                                     └─ Return { certResults: [...] }
  │                                     │
  │   extractCertPages() ◄──────────────┘
  │   parseAzureClsPageTables()
  │   parseAzureClsTable()
  │   fillLabCertColumn()
  │
  ├─ Batch PDF ─────────────────────────┤
  │   extractPDFLines() (pdf.js local)  │ (no server call)
  │   extractRecipeRowsFromLines()      │
  │   extractBatchRecordHeader()        │
  └─────────────────────────────────────┘
```

### New Architecture (TanStack Start)

```
React Component                TanStack Start Server Function
  │                                     │
  ├─ Any PDF upload ───────────────────►│
  │                                     ├─ Upload to Supabase Storage (always)
  │                                     ├─ Try text extraction (pdf.js / pdf-parse)
  │                                     ├─ Assess extracted text quality
  │                                     ├─ If sufficient → parse locally
  │                                     ├─ If not → Azure Document Intelligence OCR
  │                                     └─ Return typed result
  │◄────────────────────────────────────┘
  │
  └─ Render extracted data
```

---

## 4. Server-Side: Azure OCR Endpoint (Current Implementation)

### Route: `POST /api/azure-ocr`

**File**: `server.js` lines 449–516

**Dependencies**: `multer` (file upload), `pdf-lib` (PDF page splitting), native `fetch`

**Exact logic**:

```
1. Receive uploaded PDF via multer (multipart/form-data, field name: "file")
2. Read uploaded file bytes from disk (req.file.path)
3. Load PDF with pdf-lib: PDFDocument.load(bytes)
4. Get page count, cap at 4 pages maximum
5. For EACH page (0 to pageCount-1):
   a. Create a new single-page PDF document
   b. Copy the page from source to new doc
   c. Save as bytes
   d. POST to Azure Document Intelligence:
      URL: {endpoint}documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview
      Headers:
        Ocp-Apim-Subscription-Key: {apiKey}
        Content-Type: application/pdf
      Body: PDF bytes as Buffer
   e. Get operation-location header from response
   f. Poll operation-location up to 20 times (1.5s interval):
      GET {operation-location}
      Headers: Ocp-Apim-Subscription-Key: {apiKey}
      Response JSON: { status: "running"|"succeeded"|"failed", analyzeResult: {...} }
   g. Push final result to array
6. Return JSON: { certResults: [result1, result2, ...] }
```

**Each result object** (from Azure) has this structure when succeeded:

```json
{
  "status": "succeeded",
  "analyzeResult": {
    "tables": [
      {
        "cells": [
          {
            "rowIndex": 0,
            "columnIndex": 0,
            "content": "Energy kJ/100g"
          },
          {
            "rowIndex": 0,
            "columnIndex": 1,
            "content": "S"
          },
          {
            "rowIndex": 0,
            "columnIndex": 2,
            "content": "1234"
          }
        ]
      }
    ]
  }
}
```

---

## 5. Client-Side: Lab Cert Table Parsing (Current Implementation)

### Function Chain

```
extractLabCertPdf()          — UI handler (button click)
  └─ extractCertPages(file)  — orchestrator
       └─ sendPdfToAzure(file)     — uploads to /api/azure-ocr
       └─ parseAzureClsPageTables(tables) — per-page table merge
            └─ parseAzureClsTable(table)  — row-by-row nutrient matching
```

### `extractCertPages(file)` — Core Orchestrator

**File**: `lab-average.js` lines 407–439

**Input**: File object from `<input type="file">`  
**Output**: Array of cert objects:

```ts
type CertResult = {
  labNumber: string; // e.g. "1959101" — matched from table text
  nutrition: {
    kj: number | "";
    kcal: number | "";
    fat: number | "";
    sat: number | "";
    carbs: number | "";
    sugar: number | "";
    fibre: number | "";
    protein: number | "";
    salt: number | "";
  };
};
```

**Logic**:

1. Send file to server via `sendPdfToAzure()` (FormData POST to `/api/azure-ocr`)
2. Server splits PDF into pages and returns `{ certResults: [...] }` with Azure analysis per page
3. For each result, extract `analyzeResult.tables`
4. If tables exist, parse with `parseAzureClsPageTables()`
5. Default labNumber fallback: `"195910${index + 1}"`

### `parseAzureClsTable(table)` — Nutrition Value Extraction

**File**: `lab-average.js` lines 453–553

This is the **critical parsing logic**. It processes Azure's table cell data to extract 9 nutrition values.

**Table structure from the lab certs**:

The lab certificates (from CLS or similar labs) have a consistent format:

- Column structure typically includes: Test name | Method ref ("S") | Result value | Unit
- The reference column contains "S" (for Standard method)
- The value is found in columns after the "S" column

**Parsing algorithm**:

```
1. Merge all table cells into rows (keyed by rowIndex)
2. For each row:
   a. Join all cells, replace commas with dots, normalise whitespace
   b. Check for lab number pattern: /\b(19[0-9]{5,8})\b/
   c. Find the column containing exactly "S" (method reference marker)
   d. Scan columns AFTER the "S" column for a numeric value
   e. Skip unit columns (containing "g/100g", "kJ/100g", "kcal/100g")
   f. Match the row label against known nutrient names:
```

**Nutrient matching rules** (priority order, case-insensitive):

| Row text contains                                 | Maps to   |
| ------------------------------------------------- | --------- |
| "energy" AND "kcal"                               | `kcal`    |
| "energy" AND "kj"                                 | `kj`      |
| "available carbohydrate"                          | `carbs`   |
| "total sugars"                                    | `sugar`   |
| "total dietary fibre"                             | `fibre`   |
| "protein"                                         | `protein` |
| "sodium expressed as salt"                        | `salt`    |
| "fatty acids" AND "saturated" (NOT "unsaturated") | `sat`     |
| "fat" (NOT "fatty acids")                         | `fat`     |

**Fallback parsing** (for OCR'd text that doesn't have clean tables):

There's also a `parseClsOcrTable(text)` function (`lab-average.js` lines 567–627) that uses regex-based extraction on raw text. It uses a `grab(label)` helper:

```js
// Pattern: {label} ... S ... {number}
// The "S" may OCR as "§", "$", or "5"
regex = new RegExp(label + "[\\s\\S]{0,120}?(?:\\bS\\b|§|\\$|5)\\s*([0-9]+(?:\\.[0-9]+)?)", "i");
```

**Additional fallback calculations**:

- If `salt` is empty but `sodium` is found: `salt = sodium * 2.5`
- If `kj` is empty but `kcal` is found: `kj = Math.round(kcal * 4.184)`

---

## 6. Client-Side: Batch Record Recipe Extraction (Current Implementation)

### Function Chain

```
handlePDFExtraction()           — UI handler
  └─ extractPDFLines(file)      — pdf.js text extraction (NO server call)
  └─ extractRecipeRowsFromLines(lines)  — parse recipe rows
  └─ extractBatchRecordHeader(lines)    — parse header metadata
```

### `extractPDFLines(file)` — Client-Side Text Layer Extraction

**File**: `ingredients-claims.js` lines 427–457

**Dependencies**: `pdfjsLib` (loaded via CDN: `pdf.js 3.11.174`)

**Logic**:

```
1. Convert file to ArrayBuffer
2. Load with pdfjsLib.getDocument()
3. For each page:
   a. Get text content via page.getTextContent()
   b. Extract items with position: { text, x, y }
   c. Group items by Y coordinate (rounded) to form lines
   d. Sort groups by Y descending (top to bottom)
   e. Within each group, sort by X ascending (left to right)
   f. Join text items with spaces to form line strings
4. Return flat array of line strings
```

### `extractRecipeRowsFromLines(lines)` — Recipe Row Parser

**File**: `ingredients-claims.js` lines 462–529

**Output per row**:

```ts
type RecipeRow = {
  rmCode: string; // e.g. "RM1234", "WIP5678"
  ingredient: string; // ingredient name
  recipePercent: number; // percentage in recipe
};
```

**Parsing rules**:

```
For each line:
  1. Match RM/WIP code: /\b(?:RM|WIP)\d{4,6}\b/i
  2. If no code found, skip line
  3. Extract text after the code
  4. Find all percentage patterns: /\d+(?:\.\d+)?\s*%/g
  5. If no percentages found, skip line
  6. Choose recipe %:
     - Filter out 100% and 0%
     - Take first remaining value
     - Fallback to second value, then first
  7. Clean ingredient name: remove all numeric/percentage patterns
  8. Skip if ingredient name is empty
```

### `extractBatchRecordHeader(lines)` — Batch Header Parser

**File**: `ingredients-claims.js` lines 1074–1105

**Output**:

```ts
type BatchHeader = {
  code: string; // e.g. "FG1234", "RM5678", "WIP9012"
  name: string; // product name (text between code and date)
  date: string; // e.g. "01/06/2025"
};
```

**Parsing rules**:

```
1. Join all lines into single string
2. Match product code: /\b(?:FG|RM|WIP)\d{4,8}\b/i
3. Match date: DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
4. Find the line containing BOTH a code and a date
5. Product name = that line with code and date removed
```

---

## 7. Nutrient Data Model

Both flows ultimately produce nutrition data in this shape:

```ts
// The canonical 9-nutrient structure used throughout the app
type NutritionValues = {
  kj: number | "";
  kcal: number | "";
  fat: number | "";
  sat: number | ""; // saturated fat
  carbs: number | ""; // available carbohydrate
  sugar: number | ""; // total sugars
  fibre: number | ""; // total dietary fibre
  protein: number | "";
  salt: number | ""; // sodium expressed as salt
};

// Lab cert extraction produces up to 4 of these
type LabCertResult = {
  labNumber: string;
  nutrition: NutritionValues;
};

// Batch record extraction produces an array of these
type RecipeRow = {
  rmCode: string;
  ingredient: string;
  recipePercent: number;
};

type BatchHeader = {
  code: string;
  name: string;
  date: string;
};
```

---

## 8. Proposed React Component Architecture

### Smart Orchestrator Strategy

```
PdfExtractor Component
  │
  ├─ User selects PDF + extraction type (lab cert | batch record)
  │
  ├─ Always: Upload PDF to Supabase Storage
  │   └─ Store file reference for traceability
  │
  ├─ Step 1: Attempt text extraction (pdf.js in browser or pdf-parse on server)
  │   └─ Assess quality:
  │       - For batch records: check for RM/WIP codes + percentages
  │       - For lab certs: check for nutrient keywords + numeric values
  │
  ├─ Step 2a: If text quality is sufficient → parse locally
  │   └─ Use the same parsing logic (nutrient matching / recipe row extraction)
  │
  ├─ Step 2b: If text quality is insufficient → Azure Document Intelligence OCR
  │   └─ Split PDF into pages, send each to Azure, parse table results
  │
  └─ Return typed result to parent component
```

### Quality Assessment Heuristics

For **lab certs**, text extraction is "sufficient" if the extracted text contains:

- At least 3 of: "energy", "fat", "protein", "carbohydrate", "salt", "sugar", "fibre"
- At least 3 numeric values that look like nutrition values (0.01–9999)
- The reference marker "S" appearing in the context of a table

For **batch records**, text extraction is "sufficient" if:

- At least 1 RM/WIP code is found
- At least 1 percentage value is found

### Component Props & Return Types

```ts
// Component configuration
type PdfExtractorProps = {
  extractionType: "lab-cert" | "batch-record";
  onResult: (result: ExtractionResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: ProgressUpdate) => void;
  maxPages?: number; // default 4 for lab certs
  supabaseBucket: string; // e.g. "pdf-uploads"
  supabaseFolder?: string; // e.g. "lab-certs" or "batch-records"
};

type ExtractionResult =
  | {
      type: "lab-cert";
      method: "text-extraction" | "azure-ocr";
      fileUrl: string; // Supabase storage URL
      fileName: string;
      certs: LabCertResult[];
    }
  | {
      type: "batch-record";
      method: "text-extraction";
      fileUrl: string;
      fileName: string;
      rows: RecipeRow[];
      header: BatchHeader;
    };

type ProgressUpdate = {
  stage:
    | "uploading"
    | "extracting-text"
    | "assessing"
    | "ocr-submitting"
    | "ocr-polling"
    | "parsing"
    | "complete";
  percent: number;
  message: string;
};
```

---

## 9. Server Function (TanStack Start)

The Azure OCR call **must** happen server-side to protect the API key. Use a TanStack Start server function:

```ts
// Pseudocode for the server function
// File: app/server/pdf-ocr.ts

import { createServerFn } from "@tanstack/react-start";

export const analyzeWithAzureOcr = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  // data = { pdfBytes: Uint8Array (or base64 string), pageIndex: number }

  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  // 1. Submit PDF page to Azure
  const submitResponse = await fetch(
    `${endpoint}documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-02-29-preview`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/pdf",
      },
      body: pdfBytes,
    },
  );

  const operationLocation = submitResponse.headers.get("operation-location");

  // 2. Poll for result
  let result;
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const poll = await fetch(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": apiKey },
    });
    result = await poll.json();
    if (result.status === "succeeded") break;
    if (result.status === "failed") throw new Error("Azure OCR failed");
  }

  return result;
});
```

### Optimisation: Parallel Page Processing

The current server processes pages **sequentially**. For the new implementation, submit all pages to Azure in parallel, then poll all operations concurrently:

```ts
// Submit all pages simultaneously
const operations = await Promise.all(pages.map((pageBytes) => submitToAzure(pageBytes)));

// Poll all operations concurrently
const results = await Promise.all(operations.map((opUrl) => pollUntilComplete(opUrl)));
```

This could reduce a 4-page cert from ~30s to ~8-10s.

---

## 10. Supabase File Storage

Every PDF upload must be persisted to Supabase Storage for traceability.

### Upload Pattern

```ts
import { supabase } from "@/lib/supabase";

async function uploadPdfToSupabase(
  file: File,
  bucket: string,
  folder: string,
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${timestamp}-${safeName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    path: storagePath,
  };
}
```

### Suggested Bucket Structure

```
pdf-uploads/
  lab-certs/
    {timestamp}-{filename}.pdf
  batch-records/
    {timestamp}-{filename}.pdf
```

---

## 11. Full Parsing Logic to Reproduce

### 11a. Lab Cert Nutrition Table Parser

This must be reproduced exactly. It handles Azure Document Intelligence table output.

```ts
type AzureTableCell = {
  rowIndex: number;
  columnIndex: number;
  content: string;
};

type AzureTable = {
  cells: AzureTableCell[];
};

function parseAzureNutritionTables(tables: AzureTable[]): LabCertResult {
  // Merge all tables' cells into one
  const allCells = tables.flatMap((table) => table.cells || []);
  return parseNutritionCells(allCells);
}

function parseNutritionCells(cells: AzureTableCell[]): LabCertResult {
  const results: NutritionValues = {
    kj: "",
    kcal: "",
    fat: "",
    sat: "",
    carbs: "",
    sugar: "",
    fibre: "",
    protein: "",
    salt: "",
  };

  let labNumber = "";

  // Group cells into rows
  const rows: Record<number, string[]> = {};
  cells.forEach((cell) => {
    if (!rows[cell.rowIndex]) rows[cell.rowIndex] = [];
    rows[cell.rowIndex][cell.columnIndex] = cell.content || "";
  });

  Object.values(rows).forEach((row) => {
    const rowText = row.join(" ").replace(/,/g, ".").replace(/\s+/g, " ").trim();
    const lower = rowText.toLowerCase();

    // Extract lab number (pattern: 19 followed by 5-8 digits)
    const labMatch = rowText.match(/\b(19[0-9]{5,8})\b/);
    if (!labNumber && labMatch) labNumber = labMatch[1];

    // Find the "S" reference column (Standard method marker)
    const refIndex = row.findIndex((cell) => String(cell).trim().toUpperCase() === "S");

    if (refIndex === -1) return;

    // Find numeric value in columns after "S", skipping unit columns
    let value: number | "" = "";
    for (let i = refIndex + 1; i < row.length; i++) {
      const cell = String(row[i]).replace(",", ".").trim();

      // Skip unit columns
      if (cell.includes("g/100g") || cell.includes("kJ/100g") || cell.includes("kcal/100g"))
        continue;

      const match = cell.match(/[0-9]+(?:\.[0-9]+)?/);
      if (match) {
        value = Number(match[0]);
        break;
      }
    }

    if (value === "") return;

    // Map row label to nutrient field
    if (lower.includes("energy") && lower.includes("kcal")) {
      results.kcal = value;
    } else if (lower.includes("energy") && lower.includes("kj")) {
      results.kj = value;
    } else if (lower.includes("available carbohydrate")) {
      results.carbs = value;
    } else if (lower.includes("total sugars")) {
      results.sugar = value;
    } else if (lower.includes("total dietary fibre")) {
      results.fibre = value;
    } else if (lower.includes("protein")) {
      results.protein = value;
    } else if (lower.includes("sodium expressed as salt")) {
      results.salt = value;
    } else if (
      lower.includes("fatty acids") &&
      lower.includes("saturated") &&
      !lower.includes("unsaturated")
    ) {
      results.sat = value;
    } else if (lower.includes("fat") && !lower.includes("fatty acids")) {
      results.fat = value;
    }
  });

  return { labNumber, nutrition: results };
}
```

### 11b. Text-Based Nutrition Parser (Fallback / Text-Layer PDFs)

For PDFs with extractable text, use regex-based parsing:

```ts
function parseNutritionFromText(text: string): LabCertResult {
  const clean = text
    .replace(/,/g, ".")
    .replace(/\|/g, " ")
    .replace(/\[/g, " ")
    .replace(/\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const results: NutritionValues = {
    kj: "",
    kcal: "",
    fat: "",
    sat: "",
    carbs: "",
    sugar: "",
    fibre: "",
    protein: "",
    salt: "",
  };

  const labMatch = clean.match(/\b(19[0-9]{5,8})\b/);
  const labNumber = labMatch?.[1] || "";

  // Grab value after "S" marker (may OCR as §, $, or 5)
  function grab(label: string): number | "" {
    const regex = new RegExp(
      label + "[\\s\\S]{0,120}?(?:\\bS\\b|§|\\$|5)\\s*([0-9]+(?:\\.[0-9]+)?)",
      "i",
    );
    const match = clean.match(regex);
    return match?.[1] ? Number(match[1]) : "";
  }

  results.kcal = grab("Energy\\s*k\\s*Cal|Energy\\s*kcal");
  results.kj = grab("Energy\\s*k\\s*J|Energy\\s*kj");
  results.fat = grab("\\bFat\\b");
  results.sat = grab("Fatty\\s*Acids\\s*\\(?\\s*Saturated\\s*\\)?|Saturated");
  results.carbs = grab(
    "Available\\s*Carbohydrate|Availabie\\s*Carbohydrate|Available\\s*Carbohydrat",
  );
  results.sugar = grab("Total\\s*Sugars|Sugars");
  results.fibre = grab("Total\\s*Dietary\\s*Fibre|Dietary\\s*Fibre");
  results.protein = grab("Protein|Proteln|Protem");
  results.salt = grab("Sodium\\s*expressed\\s*as\\s*Salt|Sodium\\s*expressed\\s*as\\s*Sait");

  // Sodium → Salt conversion fallback
  if (results.salt === "") {
    const sodium = grab("\\bSodium\\b");
    if (sodium !== "") {
      results.salt = Number(((sodium as number) * 2.5).toFixed(2));
    }
  }

  // kJ from kcal fallback
  if (results.kj === "" && results.kcal !== "") {
    results.kj = Math.round((results.kcal as number) * 4.184);
  }

  return { labNumber, nutrition: results };
}
```

### 11c. Batch Record Recipe Parser

```ts
type RecipeRow = {
  rmCode: string;
  ingredient: string;
  recipePercent: number;
};

type BatchHeader = {
  code: string;
  name: string;
  date: string;
};

function parseRecipeRows(lines: string[]): RecipeRow[] {
  const rows: RecipeRow[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/\s+/g, " ").trim();

    // Match RM or WIP code
    const codeMatch = cleanLine.match(/\b(?:RM|WIP)\d{4,6}\b/i);
    if (!codeMatch) continue;

    const rmCode = codeMatch[0];
    const afterCode = cleanLine.slice(cleanLine.indexOf(rmCode) + rmCode.length).trim();

    // Find percentages
    const percentMatches = afterCode.match(/\d+(?:\.\d+)?\s*%/g) || [];
    if (!percentMatches.length) continue;

    const numericPercents = percentMatches.map((p) => parseFloat(p.replace("%", "").trim()));

    // Choose the recipe percentage
    let recipePercent: number;
    const possiblePercents = numericPercents.filter((v) => v !== 100 && v !== 0);

    if (possiblePercents.length > 0) {
      recipePercent = possiblePercents[0];
    } else if (numericPercents.length >= 2) {
      recipePercent = numericPercents[1];
    } else {
      recipePercent = numericPercents[0];
    }

    // Clean ingredient name
    const ingredient = afterCode
      .replace(/\d+(?:\.\d+)?\s*%/g, "")
      .replace(/\s+\d+(?:\.\d+)?\s*$/g, "")
      .replace(/\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$/g, "")
      .trim();

    if (!ingredient) continue;

    rows.push({ rmCode, ingredient, recipePercent });
  }

  return rows;
}

function parseBatchHeader(lines: string[]): BatchHeader {
  const joined = lines.join(" ");

  const codeMatch = joined.match(/\b(?:FG|RM|WIP)\d{4,8}\b/i);
  const dateMatch =
    joined.match(/\b\d{2}\/\d{2}\/\d{4}\b/) ||
    joined.match(/\b\d{2}-\d{2}-\d{4}\b/) ||
    joined.match(/\b\d{4}-\d{2}-\d{2}\b/);

  let name = "";

  const productLine = lines.find((line) => {
    const clean = line.replace(/\s+/g, " ").trim();
    return /\b(?:FG|RM|WIP)\d{4,8}\b/i.test(clean) && /\b\d{2}\/\d{2}\/\d{4}\b/.test(clean);
  });

  if (productLine) {
    name = productLine
      .replace(/\b(?:FG|RM|WIP)\d{4,8}\b/i, "")
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return {
    code: codeMatch ? codeMatch[0].toUpperCase() : "",
    name,
    date: dateMatch ? dateMatch[0] : "",
  };
}
```

### 11d. PDF Text Extraction (for use in browser or server)

**Browser (pdf.js)**:

```ts
// Uses pdfjs-dist package
import * as pdfjsLib from "pdfjs-dist";

async function extractTextLines(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const items = content.items.map((item: any) => ({
      text: item.str,
      x: item.transform[4],
      y: Math.round(item.transform[5]),
    }));

    // Group by Y coordinate to reconstruct lines
    const grouped: Record<number, typeof items> = {};
    items.forEach((item) => {
      if (!grouped[item.y]) grouped[item.y] = [];
      grouped[item.y].push(item);
    });

    // Sort top-to-bottom, left-to-right within each line
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
```

### 11e. PDF Page Splitting (for Azure OCR)

**Server-side (pdf-lib)**:

```ts
import { PDFDocument } from "pdf-lib";

async function splitPdfIntoPages(
  pdfBytes: Uint8Array,
  maxPages: number = 4,
): Promise<Uint8Array[]> {
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
```

---

## 12. Dependencies for New Project

```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174",
    "pdf-lib": "^1.17.1"
  }
}
```

- `pdfjs-dist`: Client-side text extraction (browser). Set worker to CDN or bundle.
- `pdf-lib`: Server-side PDF page splitting before Azure OCR submission.
- Supabase client: Already configured per project assumptions.

---

## 13. Implementation Checklist

- [ ] Add env vars: `AZURE_DOCUMENT_INTELLIGENCE_KEY`, `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
- [ ] Create Supabase storage bucket (`pdf-uploads`) with folders: `lab-certs/`, `batch-records/`
- [ ] Create server function for Azure Document Intelligence OCR (parallel page processing)
- [ ] Create `PdfExtractor` React component with:
  - [ ] File input (accept PDF only)
  - [ ] Extraction type selector (lab cert vs batch record)
  - [ ] Progress indicator
  - [ ] Smart orchestrator: text extraction first → quality check → OCR fallback
- [ ] Port all parsing functions as typed utilities:
  - [ ] `parseNutritionCells()` — Azure table cell parser
  - [ ] `parseNutritionFromText()` — regex fallback parser
  - [ ] `parseRecipeRows()` — batch recipe row parser
  - [ ] `parseBatchHeader()` — batch header parser
  - [ ] `extractTextLines()` — pdf.js text extraction
  - [ ] `splitPdfIntoPages()` — pdf-lib page splitter
- [ ] Always upload PDF to Supabase before processing
- [ ] Return structured, typed results to parent component

---

## 14. Known Edge Cases & OCR Quirks

1. **Commas as decimal separators**: Lab certs may use `,` instead of `.` — all parsing replaces `,` with `.`
2. **OCR misreads of "S" marker**: The method reference "S" can OCR as `§`, `$`, or `5` — the regex fallback handles all variants
3. **OCR misreads of nutrient names**: Known misspellings handled: "Proteln", "Protem" (Protein), "Availabie" (Available), "Sait" (Salt), "Carbohydrat" (Carbohydrate)
4. **Lab number pattern**: Always starts with `19` followed by 5–8 digits (e.g., `1959101`)
5. **Max 4 pages**: Lab certs are capped at 4 pages (4 certificates)
6. **Sodium → Salt conversion**: If salt row is missing but sodium is found, multiply by 2.5
7. **kJ → kcal conversion**: If kJ is missing but kcal is found, multiply by 4.184
8. **Product codes**: Batch records use `FG`, `RM`, `WIP` prefixed codes with 4–8 digits
9. **Percentage selection**: When multiple percentages exist on a recipe line, filter out 0% and 100% first, then take the first remaining value
