import WelcomeUser from "#/components/welcome-user";
import { Show } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to Galmere Portal</h1>

      <Show when="signed-in">
        <WelcomeUser />
      </Show>
      <Show when="signed-out">
        <div className="text-sm text-slate-500">
          Please sign in or sign up to access the dashboard and documents.
        </div>
        <nav className="mt-4 flex items-center gap-4">
          <Link to="/sign-in/$">Sign In</Link>
          <Link to="/sign-up/$">Sign Up</Link>
        </nav>
      </Show>
    </div>
  );
}
