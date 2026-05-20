import { Show, SignOutButton, UserButton } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
     
      <Show when="signed-in">
        <UserButton />
        <SignOutButton />
      </Show>
      <Show when="signed-out">
        {/* <SignInButton />
        <SignUpButton /> */}
        <Link to="/sign-in/$">Sign In</Link>
        <Link to="/sign-up/$">Sign Up</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/documents">Documents</Link>
      </Show>
    </div>
  )
}
