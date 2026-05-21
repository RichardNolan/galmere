import { Show, UserButton } from "@clerk/tanstack-react-start";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Beaker,
  BookOpenText,
  ClipboardCheck,
  FileArchive,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Package,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "#/components/ui/sheet";

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileArchive },
  { to: "/saved-products", label: "Saved Products", icon: Package },
  { to: "/additives", label: "Food Additives", icon: Beaker },
  { to: "/flavourings", label: "Flavourings", icon: FlaskConical },
  { to: "/ingredients-claims", label: "Ingredient Claims", icon: SearchCheck },
  { to: "/lab-average", label: "Lab Average", icon: TestTube2 },
  { to: "/nutrition", label: "Nutrition", icon: Scale },
  { to: "/labeling", label: "Labeling", icon: BookOpenText },
  { to: "/packaging", label: "Packaging", icon: ClipboardCheck },
  { to: "/process-haccp", label: "Process HACCP", icon: ShieldCheck },
];

const topLevelLinks = [
  { label: "Partners", to: "/documents" },
  { label: "Compliance", to: "/labeling" },
  { label: "Support", to: "/dashboard" },
];

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

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-400 items-center gap-4 px-4 lg:px-8">
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
                <SheetDescription>Navigate key food service and compliance sections.</SheetDescription>
              </SheetHeader>
              <Separator className="mb-4" />
              <NavigationList onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link to="/" className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <Sparkles className="size-4" />
            </span>
            <span className="font-[Fraunces] text-xl font-semibold tracking-tight text-slate-900">Galmere</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {topLevelLinks.map((link) => (
              <Button key={link.label} variant="ghost" size="sm" asChild>
                <Link to={link.to} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Badge className="hidden sm:inline-flex" variant="default">
              Food Services Portal
            </Badge>
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

        <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
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
          <span className="font-[Fraunces] text-2xl font-semibold tracking-tight text-slate-900">Galmere</span>
        </Link>
        <div className="w-full rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-300/30 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
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
