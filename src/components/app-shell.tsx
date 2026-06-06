import galmereLogo from "#/assets/images/Galmere-logo.png";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";
import { setSupabaseAccessTokenGetter, supabase } from "#/lib/supabase";
import { Show, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { Link, linkOptions, useRouterState } from "@tanstack/react-router";
import {
  Beaker,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  FileArchive,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Package,
  Scale,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = linkOptions([
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileArchive },
  { to: "/products", label: "Products", icon: Package },
  { to: "/raw-materials", label: "Raw Materials", icon: Boxes },
  { to: "/additives", label: "Food Additives", icon: Beaker },
  { to: "/flavourings", label: "Flavourings", icon: FlaskConical },
  { to: "/allergens", label: "Allergens", icon: SearchCheck },
  { to: "/ingredients-claims", label: "Ingredient Claims", icon: SearchCheck },
  { to: "/lab-average", label: "Lab Average", icon: TestTube2 },
  { to: "/nutrition", label: "Nutrition", icon: Scale },
  { to: "/labeling", label: "Labeling", icon: BookOpenText },
  { to: "/packaging", label: "Packaging", icon: ClipboardCheck },
  { to: "/process-haccp", label: "Process HACCP", icon: ShieldCheck },
]);

const topLevelLinks = [
  { label: "Brands", href: "/brands" },
  { label: "Raw Materials", href: "/raw-materials" },
  { label: "Packaging", href: "/packaging" },
  { label: "Documents", href: "/documents" },
];

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

function HeaderSearch() {
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
            description: brand.brandCode ? `Code: ${brand.brandCode}` : "Open the brands workspace.",
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
              description: [brand.brandName, product.versionNumber]
                .filter(Boolean)
                .join(" • "),
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

function NavigationList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="space-y-1" aria-label="Portal navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to + "/"));

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "text-slate-700 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Icon className={`size-4 ${isActive ? "text-white" : "text-emerald-700"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ShellFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="mt-8 border-t border-slate-200/80 px-6 py-5 text-xs text-slate-600 lg:px-10">
      <p>Copyright {year} Galmere. Regulatory intelligence for food services.</p>
    </footer>
  );
}

function SignedInShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[linear-gradient(145deg,#f9faf6_0%,#f2f7ef_38%,#eef5ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(245,158,11,0.14)_0%,transparent_44%),radial-gradient(circle_at_84%_4%,rgba(16,185,129,0.14)_0%,transparent_35%)]" />

      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-[76px] max-w-400 items-center gap-5 px-4 lg:px-8">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="lg:hidden">
              <SheetHeader>
                <SheetTitle>Portal Menu</SheetTitle>
                <SheetDescription>
                  Navigate key food service and compliance sections.
                </SheetDescription>
              </SheetHeader>
              <Separator className="mb-4" />
              <NavigationList onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="inline-flex shrink-0 items-center">
            <img
              src={galmereLogo}
              alt="Galmere"
              className="h-auto w-[200px] max-w-[200px] object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {topLevelLinks.map((link) => (
              <Button key={link.label} variant="ghost" size="sm" asChild>
                <a
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-[#0F5F66]/5 hover:text-[#0F5F66]"
                >
                  {link.label}
                </a>
              </Button>
            ))}
          </nav>

          <HeaderSearch />

          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-400">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-slate-200/70 bg-slate-50/80 p-4 lg:block">
          <Card className="mb-4 overflow-hidden border-white/80">
            <img
              src="https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=900&q=80"
              alt="Fresh produce arranged in a kitchen workspace"
              className="h-24 w-full object-cover"
            />
            <CardContent className="p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Operations</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Navigation Workspace</p>
            </CardContent>
          </Card>

          <NavigationList />
        </aside>

        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <ShellFooter />
    </div>
  );
}

function SignedOutShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f7fbf4_0%,#ecf7f4_45%,#edf3fb_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(245,158,11,0.2)_0%,transparent_34%),radial-gradient(circle_at_80%_16%,rgba(16,185,129,0.2)_0%,transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Sparkles className="size-5" />
          </span>
          <span className="font-[Fraunces] text-2xl font-semibold tracking-tight text-slate-900">
            Galmere
          </span>
        </Link>
        <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-300/30 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const { getToken } = useAuth();

  useEffect(() => {
    setSupabaseAccessTokenGetter(async () => {
      return getToken();
    });

    return () => {
      setSupabaseAccessTokenGetter(null);
    };
  }, [getToken]);

  return (
    <>
      <Show when="signed-in">
        <SignedInShell>{children}</SignedInShell>
      </Show>
      <Show when="signed-out">
        <SignedOutShell>{children}</SignedOutShell>
      </Show>
    </>
  );
}
