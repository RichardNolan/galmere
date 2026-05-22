import { Link } from "@tanstack/react-router";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-700 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-semibold text-slate-900">Galmere</p>
          <p>Copyright {year} Olivia Morris Nolan. All rights reserved.</p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Footer navigation">
          <p className="font-medium text-slate-900">Explore</p>
          <Link to="/" className="hover:text-slate-900 hover:underline">
            Home
          </Link>
          <Link to="/dashboard" className="hover:text-slate-900 hover:underline">
            Dashboard
          </Link>
          <Link to="/documents" className="hover:text-slate-900 hover:underline">
            Documents
          </Link>
          <Link to="/products" className="hover:text-slate-900 hover:underline">
            Products
          </Link>
        </nav>

        <div className="flex flex-col gap-2">
          <p className="font-medium text-slate-900">Legal & Contact</p>
          <a className="hover:text-slate-900 hover:underline" href="mailto:hello@galmere.com">
            hello@galmere.com
          </a>
          <a className="hover:text-slate-900 hover:underline" href="/privacy">
            Privacy Policy
          </a>
          <a className="hover:text-slate-900 hover:underline" href="/terms">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
