import { useUser } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export default function WelcomeUser() {
  const { user } = useUser();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "there";
  const email = user?.primaryEmailAddress?.emailAddress;
  const avatarUrl = user?.imageUrl;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full ring-2 ring-slate-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-slate-200 text-slate-600">
                {fullName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{fullName}</h2>
            {email ? <p className="text-sm text-slate-600">{email}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/saved-products"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            View Products
          </Link>
          <Link
            to="/documents"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Open Documents
          </Link>
        </div>
      </div>
    </section>
  );
}
