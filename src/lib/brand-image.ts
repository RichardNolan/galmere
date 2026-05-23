const localBrandImages = import.meta.glob("../assets/images/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const localBrandImageByFileName = new Map<string, string>();

for (const [filePath, fileUrl] of Object.entries(localBrandImages)) {
  const fileName = filePath.split("/").pop();

  if (fileName) {
    localBrandImageByFileName.set(fileName.toLowerCase(), fileUrl);
  }
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const getImageBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_BRAND_IMAGE_BASE_URL?.trim();

  if (!baseUrl) return null;

  return baseUrl.replace(/\/+$/, "");
};

const normalizeImageRef = (value: string) => {
  const withoutQueryOrHash = value.split(/[?#]/)[0]?.trim() ?? "";

  try {
    return decodeURIComponent(withoutQueryOrHash);
  } catch {
    return withoutQueryOrHash;
  }
};

export const getBrandImageSrc = (brandImage: string | null | undefined) => {
  if (!brandImage) return null;

  const normalizedRef = normalizeImageRef(brandImage);

  if (!normalizedRef) return null;
  if (isAbsoluteUrl(normalizedRef)) return normalizedRef;

  const fileName = normalizedRef.split("/").pop();

  if (!fileName) return null;

  const baseUrl = getImageBaseUrl();

  if (baseUrl) {
    const relativePath = normalizedRef.replace(/^\/+/, "").replace(/^assets\/images\//i, "");

    return `${baseUrl}/assets/images/${relativePath}`;
  }

  const localImage = localBrandImageByFileName.get(fileName.toLowerCase());

  if (localImage) return localImage;

  return `/assets/images/${fileName}`;
};
