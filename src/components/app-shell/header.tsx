import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-400 items-center gap-4 px-4 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Sparkles className="size-4" />
          </span>
          <span className="font-[Fraunces] text-xl font-semibold tracking-tight text-slate-900">
            Galmere
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to={"/brands"}>Brands</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Badge className="hidden sm:inline-flex" variant="default">
            Food Services Portal
          </Badge>
          <UserButton />
        </div>
      </div>
    </header>
  );
};
