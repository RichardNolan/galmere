import { supabase } from "#/lib/supabase";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchResultType =
  | "Brand"
  | "Product"
  | "Raw Material"
  | "Packaging"
  | "Supplier"
  | "Document";

type SearchResult = {
  id: string;
  name: string;
  type: SearchResultType;
  href: string;
  description?: string;
};

type BrandRow = {
  id: string | number | null;
  brandName: string | null;
  brandCode: string | null;
  products?: Array<{
    id: string;
    productName: string | null;
    versionNumber: string | null;
  }> | null;
};

type RawMaterialSearchRow = {
  id: string;
  rm_code: string;
  name: string;
  supplier_name: string | null;
  country_of_origin: string | null;
};

const staticHeaderSearchResults: SearchResult[] = [
  {
    id: "packaging-page",
    name: "Packaging",
    type: "Packaging",
    href: "/packaging",
    description: "Packaging standards, approved specs, and format constraints.",
  },
  {
    id: "documents-page",
    name: "Documents",
    type: "Document",
    href: "/documents",
    description: "Specification sheets, approvals, and internal files.",
  },
];

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveResults, setLiveResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSearchData() {
      setIsLoading(true);

      const [brandsResult, rawMaterialsResult] = await Promise.all([
        supabase
          .from("brands")
          .select("id, brandName, brandCode, products:products(id, productName, versionNumber)")
          .order("brandName", { ascending: true }),
        supabase
          .from("raw_materials")
          .select("id, rm_code, name, supplier_name, country_of_origin")
          .order("name", { ascending: true }),
      ]);

      if (isCancelled) {
        return;
      }

      const nextResults: SearchResult[] = [...staticHeaderSearchResults];

      if (!brandsResult.error) {
        const brands = (brandsResult.data ?? []) as BrandRow[];

        brands.forEach((brand) => {
          if (!brand.brandName) {
            return;
          }

          nextResults.push({
            id: `brand-${brand.id ?? brand.brandCode ?? brand.brandName}`,
            name: brand.brandName,
            type: "Brand",
            href: "/brands",
            description: brand.brandCode
              ? `Code: ${brand.brandCode}`
              : "Open the brands workspace.",
          });

          brand.products?.forEach((product) => {
            if (!product.productName) {
              return;
            }

            nextResults.push({
              id: `product-${product.id}`,
              name: product.productName,
              type: "Product",
              href: `/products/${product.id}`,
              description: [brand.brandName, product.versionNumber].filter(Boolean).join(" • "),
            });
          });
        });
      }

      if (!rawMaterialsResult.error) {
        const rawMaterials = (rawMaterialsResult.data ?? []) as RawMaterialSearchRow[];
        const supplierMap = new Map<string, SearchResult>();

        rawMaterials.forEach((material) => {
          nextResults.push({
            id: `raw-material-${material.id}`,
            name: material.name,
            type: "Raw Material",
            href: "/raw-materials",
            description: [material.rm_code, material.supplier_name, material.country_of_origin]
              .filter(Boolean)
              .join(" • "),
          });

          if (material.supplier_name && !supplierMap.has(material.supplier_name)) {
            supplierMap.set(material.supplier_name, {
              id: `supplier-${material.supplier_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: material.supplier_name,
              type: "Supplier",
              href: "/raw-materials",
              description: "Supplier records linked through raw materials.",
            });
          }
        });

        nextResults.push(...supplierMap.values());
      }

      // TODO: Replace the static packaging result with live packaging records when that data source exists.
      // TODO: Replace the static documents result with live document or attachment records when exposed globally.

      setLiveResults(nextResults);
      setIsLoading(false);
    }

    void loadSearchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if ((isOpen || isMobileExpanded) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileExpanded, isOpen]);

  const filteredResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return liveResults
      .filter((result) => {
        return [result.name, result.type, result.description]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalized));
      })
      .slice(0, 8);
  }, [liveResults, query]);

  const showDropdown = isOpen && (query.trim().length > 0 || isLoading);

  const openResult = (href: string) => {
    setIsOpen(false);
    setIsMobileExpanded(false);
    window.location.assign(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setIsMobileExpanded(false);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredResults[0]) {
        openResult(filteredResults[0].href);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative ml-auto flex items-center gap-3">
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
        aria-label="Open search"
        onClick={() => {
          setIsMobileExpanded((current) => !current);
          setIsOpen(true);
        }}
      >
        <Search className="size-4" />
      </button>

      <div
        className={`${
          isMobileExpanded ? "flex" : "hidden"
        } absolute right-0 top-[calc(100%+0.75rem)] w-[min(24rem,calc(100vw-2rem))] flex-col lg:relative lg:right-auto lg:top-auto lg:flex lg:w-[340px]`}
      >
        <label className="relative flex h-10 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm transition focus-within:border-[#0F5F66]/30 focus-within:bg-white focus-within:shadow-md">
          <Search className="ml-4 size-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, raw materials, packaging..."
            className="h-full w-full bg-transparent px-3 pr-10 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              className="mr-2 inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </label>

        {showDropdown ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-slate-500">Loading search data...</div>
            ) : filteredResults.length ? (
              <div className="max-h-96 overflow-y-auto py-2">
                {filteredResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    onClick={() => openResult(result.href)}
                  >
                    <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {result.type}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {result.name}
                      </span>
                      {result.description ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {result.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">No matching results found</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
