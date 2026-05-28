// Tracking de origem de tráfego + integração com Meta Pixel.
// Persistido em localStorage no primeiro hit e enviado ao signup.

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const
type UtmKey = (typeof UTM_KEYS)[number]
type UtmRecord = Partial<Record<UtmKey, string>> & { landed_at?: string; referrer?: string }

const STORAGE_KEY = "kaira:utm"

/**
 * Captura UTMs da URL atual e persiste em localStorage (first-touch wins).
 * Chamar uma vez no boot — typicamente no main.tsx ou App.
 */
export function captureUtm(): UtmRecord {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const captured: UtmRecord = {}
  let foundAny = false
  for (const k of UTM_KEYS) {
    const v = params.get(k)
    if (v) {
      captured[k] = v
      foundAny = true
    }
  }
  if (!foundAny) return readUtm()

  captured.landed_at = new Date().toISOString()
  captured.referrer = document.referrer || undefined

  // First-touch: só grava se não existir ainda
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) localStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
  } catch {}
  return captured
}

export function readUtm(): UtmRecord {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as UtmRecord
  } catch {}
  return {}
}

export function clearUtm() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// --- Meta Pixel ---
// Placeholder até VITE_META_PIXEL_ID estar definido no .env.local

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false
  try { return window.localStorage.getItem("kaira_cookies_consent") === "all" } catch { return false }
}

export function initMetaPixel(pixelId: string | undefined = import.meta.env.VITE_META_PIXEL_ID as string | undefined) {
  if (!pixelId || typeof window === "undefined") return
  if (!hasMarketingConsent()) return // LGPD: só inicializa Pixel com consentimento
  if (window.fbq) return // já carregado

  ;(function (f, b, e, v, n) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn: any = function () {
      // eslint-disable-next-line prefer-rest-params
      fn.callMethod ? fn.callMethod.apply(fn, arguments) : fn.queue.push(arguments)
    }
    fn.push = fn
    fn.loaded = true
    fn.version = "2.0"
    fn.queue = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(f as any).fbq = fn
    if (!f._fbq) f._fbq = fn
    const t = b.createElement(e) as HTMLScriptElement
    t.async = true
    t.src = v
    const s = b.getElementsByTagName(e)[0]
    s.parentNode?.insertBefore(t, s)
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js", "fbq")

  window.fbq?.("init", pixelId)
  window.fbq?.("track", "PageView")
}

/** Dispara evento Meta. Faz no-op se Pixel não foi inicializado. */
export function trackPixel(event: "Lead" | "CompleteRegistration" | "Purchase" | "InitiateCheckout" | "ViewContent", params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return
  if (!hasMarketingConsent()) return
  window.fbq("track", event, params ?? {})
}
