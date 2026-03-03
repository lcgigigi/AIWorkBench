import { createMockApi } from './mockApi'

declare global {
  interface Window {
    __WB_MOCKS_INSTALLED__?: boolean
  }
}

export async function installMocksIfNeeded() {
  const enabled = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'
  if (!enabled) return
  if (window.__WB_MOCKS_INSTALLED__) return
  window.__WB_MOCKS_INSTALLED__ = true

  const mock = createMockApi()
  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : String(input)
    const url = new URL(raw, window.location.origin)
    if (url.pathname.startsWith('/api/')) {
      return mock.route(url, init)
    }
    return original(input as any, init)
  }
}

