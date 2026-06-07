import { Card, CardContent } from "#/components/ui/card";

export const SideBar = () => {
  return (
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
  );
};

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
