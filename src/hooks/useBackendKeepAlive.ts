import { useEffect } from 'react'

/** Stay under typical free-tier idle spin-down (~15m). */
const INTERVAL_MS = 10 * 60 * 1000

/** Same host as Socket.IO — see `useSocket` `getSocketUrl`. */
function getApiBaseUrl(): string | undefined {
  const direct = import.meta.env.VITE_SOCKET_URL
  if (typeof direct === 'string' && direct.length > 0) return direct
  const api = import.meta.env.VITE_API_URL
  if (typeof api === 'string' && api.length > 0) return api
  return undefined
}

function pingHealth(base: string): void {
  const url = new URL('/health', base).href
  fetch(url, { method: 'GET', cache: 'no-store' }).catch(() => {})
}

/**
 * Periodic GET /health while the SPA is open, to reduce cold starts on idle hosts
 * (e.g. Render free). No-op if no API base URL is configured.
 */
export function useBackendKeepAlive(): void {
  useEffect(() => {
    const base = getApiBaseUrl()
    if (!base) return

    const run = () => pingHealth(base)
    run()

    const id = globalThis.setInterval(run, INTERVAL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      globalThis.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
