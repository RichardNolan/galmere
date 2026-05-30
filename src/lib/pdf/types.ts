export type NutritionExtractionValues = {
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

export type LabCertResult = {
  labNumber: string;
  nutrition: NutritionExtractionValues;
};

export type RecipeRow = {
  rmCode: string;
  ingredient: string;
  recipePercent: number;
};

export type BatchHeader = {
  code: string;
  name: string;
  date: string;
};

export type AzureTableCell = {
  rowIndex: number;
  columnIndex: number;
  content: string;
};

export type AzureTable = {
  cells: AzureTableCell[];
};

export type AzureAnalyzeResult = {
  status: "running" | "succeeded" | "failed";
  analyzeResult?: {
    tables?: AzureTable[];
  };
};

export type ExtractionResult =
  | {
      type: "lab-cert";
      method: "text-extraction" | "azure-ocr";
      fileUrl?: string;
      fileName: string;
      certs: LabCertResult[];
    }
  | {
      type: "batch-record";
      method: "text-extraction";
      fileUrl?: string;
      fileName: string;
      rows: RecipeRow[];
      header: BatchHeader;
    };

export type ProgressUpdate = {
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
