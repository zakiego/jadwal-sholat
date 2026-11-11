import { createRouter as createTanStackRouter, type AnyRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/** How long the page can sit hidden before we refetch the route data on return. */
const RESUME_REFRESH_MS = 60_000

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  if (typeof window !== 'undefined') refreshOnResume(router)

  return router
}

/**
 * Reloads the loaders when the user comes back after a while, reconnects, or the
 * browser restores the page from the back/forward cache. The home page guesses the
 * city from the IP, so a phone left open overnight may now be somewhere else.
 */
function refreshOnResume(router: AnyRouter) {
  let hiddenAt = 0
  const refresh = () => router.invalidate()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
    } else if (hiddenAt && Date.now() - hiddenAt > RESUME_REFRESH_MS) {
      hiddenAt = 0
      refresh()
    }
  })
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refresh()
  })
  window.addEventListener('online', refresh)
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
