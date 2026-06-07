import galmereLogo from "#/assets/images/Galmere-logo.png";
import { Button } from "#/components/ui/button";
import { UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { HeaderSearch } from "./search";

export const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex h-19 max-w-400 items-center gap-5 px-4 lg:px-8">
        <Link to="/dashboard" className="inline-flex shrink-0 items-center">
          <img
            src={galmereLogo}
            alt="Galmere"
            className="h-auto w-[200px] max-w-[200px] object-contain"
          />
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to={"/brands"}>Brands</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={"/raw-materials"}>Raw Materials</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={"/packaging"}>Packaging</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={"/documents"}>Documents</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <HeaderSearch />
          <UserButton />
        </div>
      </div>
    </header>
  );
};
