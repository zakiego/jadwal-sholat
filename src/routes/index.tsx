import { createFileRoute, redirect } from "@tanstack/react-router"

// Temporary: the home page is the hero picker until a variant is chosen.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/prototypes/hero", search: { v: 1, city: undefined } })
  },
})
