import type { AzureTable, AzureTableCell, LabCertResult, NutritionExtractionValues } from "./types";

const emptyNutrition: NutritionExtractionValues = {
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

export function parseAzureNutritionTables(tables: AzureTable[]): LabCertResult {
  const allCells = tables.flatMap((table) => table.cells || []);
  return parseNutritionCells(allCells);
}

function parseNutritionCells(cells: AzureTableCell[]): LabCertResult {
  const results: NutritionExtractionValues = { ...emptyNutrition };
  let labNumber = "";

  const rows: Record<number, string[]> = {};
  for (const cell of cells) {
    if (!rows[cell.rowIndex]) rows[cell.rowIndex] = [];
    rows[cell.rowIndex][cell.columnIndex] = cell.content || "";
  }

  for (const row of Object.values(rows)) {
    const rowText = row.join(" ").replace(/,/g, ".").replace(/\s+/g, " ").trim();
    const lower = rowText.toLowerCase();

    const labMatch = rowText.match(/\b(19[0-9]{5,8})\b/);
    if (!labNumber && labMatch) labNumber = labMatch[1];

    const refIndex = row.findIndex((cell) => String(cell).trim().toUpperCase() === "S");
    if (refIndex === -1) continue;

    let value: number | "" = "";
    for (let i = refIndex + 1; i < row.length; i++) {
      const cell = String(row[i]).replace(",", ".").trim();
      if (cell.includes("g/100g") || cell.includes("kJ/100g") || cell.includes("kcal/100g"))
        continue;

      const match = cell.match(/[0-9]+(?:\.[0-9]+)?/);
      if (match) {
        value = Number(match[0]);
        break;
      }
    }

    if (value === "") continue;

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
  }

  return { labNumber, nutrition: results };
}

export function parseNutritionFromText(text: string): LabCertResult {
  const clean = text
    .replace(/,/g, ".")
    .replace(/\|/g, " ")
    .replace(/\[/g, " ")
    .replace(/\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const results: NutritionExtractionValues = { ...emptyNutrition };

  const labMatch = clean.match(/\b(19[0-9]{5,8})\b/);
  const labNumber = labMatch?.[1] || "";

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

  if (results.salt === "") {
    const sodium = grab("\\bSodium\\b");
    if (sodium !== "") {
      results.salt = Number(((sodium as number) * 2.5).toFixed(2));
    }
  }

  if (results.kj === "" && results.kcal !== "") {
    results.kj = Math.round((results.kcal as number) * 4.184);
  }

  return { labNumber, nutrition: results };
}
