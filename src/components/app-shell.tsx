import { setSupabaseAccessTokenGetter } from "#/lib/supabase";
import { Show, useAuth } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import {
  Beaker,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  Package,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Header } from "./app-shell/header";

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
  { to: "/products1", label: "Products", icon: Package },
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
];

function ShellFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="mt-8 border-t border-slate-200/80 px-6 py-5 text-xs text-slate-600 lg:px-10">
      <p>Copyright {year} Galmere. Regulatory intelligence for food services.</p>
    </footer>
  );
}

function SignedInShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-[linear-gradient(145deg,#f9faf6_0%,#f2f7ef_38%,#eef5ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(245,158,11,0.14)_0%,transparent_44%),radial-gradient(circle_at_84%_4%,rgba(16,185,129,0.14)_0%,transparent_35%)]" />

      <Header />

      <div className="relative mx-auto flex w-full max-w-400">
        {/* <Sidebar /> */}

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
