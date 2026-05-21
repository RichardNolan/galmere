import { UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Galmere
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-700 hover:text-slate-900">
            Home
          </Link>
          <Link to="/dashboard" className="text-slate-700 hover:text-slate-900">
            Dashboard
          </Link>
          <Link to="/documents" className="text-slate-700 hover:text-slate-900">
            Documents
          </Link>
          <Link to="/saved-products" className="text-slate-700 hover:text-slate-900">
            Products
          </Link>
        </nav>
        <UserButton />
      </div>
    </header>
  );
}
