export function assessLabCertQuality(text: string): boolean {
  const lower = text.toLowerCase();

  const nutrientKeywords = ["energy", "fat", "protein", "carbohydrate", "salt", "sugar", "fibre"];
  const keywordCount = nutrientKeywords.filter((kw) => lower.includes(kw)).length;

  const numericValues = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
  const nutritionRange = numericValues.filter((v) => {
    const n = parseFloat(v);
    return n >= 0.01 && n <= 9999;
  });

  const hasRefMarker = /\bS\b/.test(text);

  return keywordCount >= 3 && nutritionRange.length >= 3 && hasRefMarker;
}

export function assessBatchRecordQuality(text: string): boolean {
  const hasCode = /\b(?:RM|WIP)\d{4,6}\b/i.test(text);
  const hasPercent = /\d+(?:\.\d+)?\s*%/.test(text);

  return hasCode && hasPercent;
}
