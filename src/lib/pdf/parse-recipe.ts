import type { BatchHeader, RecipeRow } from "./types";

export function parseRecipeRows(lines: string[]): RecipeRow[] {
  const rows: RecipeRow[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/\s+/g, " ").trim();

    const codeMatch = cleanLine.match(/\b(?:RM|WIP)\d{4,6}\b/i);
    if (!codeMatch) continue;

    const rmCode = codeMatch[0];
    const afterCode = cleanLine.slice(cleanLine.indexOf(rmCode) + rmCode.length).trim();

    const percentMatches = afterCode.match(/\d+(?:\.\d+)?\s*%/g) || [];
    if (!percentMatches.length) continue;

    const numericPercents = percentMatches.map((p) => parseFloat(p.replace("%", "").trim()));

    let recipePercent: number;
    const possiblePercents = numericPercents.filter((v) => v !== 100 && v !== 0);

    if (possiblePercents.length > 0) {
      recipePercent = possiblePercents[0];
    } else if (numericPercents.length >= 2) {
      recipePercent = numericPercents[1];
    } else {
      recipePercent = numericPercents[0];
    }

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

export function parseBatchHeader(lines: string[]): BatchHeader {
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
