import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up/$')({
  component: Page,
})

function Page() {
  return <main className="grid place-items-center p-2 sm:p-4">
      <SignUp />
    </main>
}