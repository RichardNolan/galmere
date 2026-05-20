import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up/$')({
  component: Page,
})

function Page() {
  return     <main className="min-h-screen grid place-items-center p-4">
      <SignUp />
    </main>
}