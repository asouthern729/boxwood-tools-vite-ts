// Types
import type * as AuthTypes from './types'
import { APP_BASE as CONFIG_APP_BASE } from '../../config'

/**
 * Exchange an Auth0 authorization code for an access token
 *
 * POST /token
 *
 * Called from the Login page once Auth0 has round-tripped back to our redirect_uri with
 * ?code&state. Returns null on a state mismatch or a rejected code, rather than throwing, since
 * the caller's response (send the user back through startLogin) is the same either way.
 */
export const completeLogin = async (code: string, state: string): Promise<string | null> => {
  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  const clientId = sessionStorage.getItem(CLIENT_KEY)

  if(state !== expectedState || !verifier || !clientId) return null

  const res = await fetch(`${ ORIGIN }/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, code_verifier: verifier, redirect_uri: REDIRECT_URI, client_id: clientId }),
  })

  if(!res.ok) return null

  const data = await res.json()
  const expiresAt = Date.now() + data.expires_in * 1000 - 30_000
  const token: AuthTypes.StoredToken = { accessToken: data.access_token, expiresAt }
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))

  return token.accessToken
}

/**
 * Return (and clear) the page the user was on before getting bounced through login
 *
 * Lets Login send them back where they meant to be instead of always landing on "/"
 */
export const consumeReturnTo = (): string => {
  const returnTo = sessionStorage.getItem(RETURN_TO_KEY) ?? "/"
  sessionStorage.removeItem(RETURN_TO_KEY)
  return returnTo
}

/**
 * Fetch with a bearer token attached, logging in first (or re-logging in on a 401)
 *
 * Domain action modules (AppActions et al.) call through this instead of touching auth
 * internals directly — it's the one place that knows how to get/refresh a bearer token.
 */
export const authorizedFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const token = getStoredToken() ?? await startLogin()
  
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${ token }` },
  })

  if(res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY)
    return startLogin()
  }

  return res
}

/**
 * Whether a token is stored, expired or not
 *
 * An expired token still means the user signed in this tab (and likely still has an Auth0
 * session), so they still have something to log out of.
 */
export const hasStoredToken = (): boolean => sessionStorage.getItem(TOKEN_KEY) !== null

/**
 * Sign out of the tools and end the Auth0 session
 *
 * GET /logout?return_to=…
 *
 * Clears all of sessionStorage, which holds only auth state and the page chats' agent session ids.
 * The backend ends the Auth0 session (otherwise the next login would sign straight back in) and
 * sends the browser to return_to, the app's landing page, which doesn't trigger a login itself.
 */
export const logout = (): void => {
  sessionStorage.clear()
  // Auth0's session is about to end, so a silent sign-in on the landing page could only fail
  sessionStorage.setItem(SILENT_TRIED_KEY, "1")

  const url = new URL(`${ ORIGIN }/logout`)
  url.searchParams.set("return_to", POST_LOGOUT_URI)
  window.location.href = url.toString()
}

/**
 * Start a sign-in from a Login button, returning to the current page afterwards
 *
 * Same flow authorizedFetch kicks off on its own when a request needs a token.
 */
export const login = (): void => {
  void startLogin()
}

/**
 * Whether a silent sign-in is worth trying: no usable token, and not already tried this tab
 *
 * Tried once per tab so a failed attempt (no Auth0 session) doesn't redirect on every visit.
 */
export const canTrySilentLogin = (): boolean =>
  getStoredToken() === null && sessionStorage.getItem(SILENT_TRIED_KEY) === null

/**
 * Sign in from an existing Auth0 session without any login UI (prompt=none)
 *
 * The browser round-trips through Auth0 either way: back to /login with a code when there's a
 * session, or with error=login_required when there isn't, after which the Login button shows.
 * Marks the attempt synchronously so a second call (e.g. StrictMode's double effect) is a no-op.
 */
export const silentLogin = (): void => {
  if(!canTrySilentLogin()) return

  sessionStorage.setItem(SILENT_TRIED_KEY, "1")
  void startLogin({ silent: true })
}

const ORIGIN = window.location.origin
const APP_BASE = CONFIG_APP_BASE.replace(/\/$/, "")
const REDIRECT_URI = `${ ORIGIN }${ APP_BASE }/login`
const POST_LOGOUT_URI = `${ ORIGIN }${ APP_BASE }/`

const TOKEN_KEY = "boxwood_tools_token"
const CLIENT_KEY = "boxwood_tools_client_id"
const VERIFIER_KEY = "boxwood_tools_code_verifier"
const STATE_KEY = "boxwood_tools_oauth_state"
const RETURN_TO_KEY = "boxwood_tools_return_to"
const SILENT_TRIED_KEY = "boxwood_tools_silent_login_tried"

const base64Url = (bytes: Uint8Array) => {
  let binary = ""
  for(const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const randomString = (length: number) => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

const sha256Base64Url = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return base64Url(new Uint8Array(digest))
}

const getStoredToken = (): string | null => {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if(!raw) return null

    const parsed: AuthTypes.StoredToken = JSON.parse(raw)
    return Date.now() < parsed.expiresAt ? parsed.accessToken : null
  } catch {
    return null
  }
}

/**
 * Register a DCR client, then redirect the browser to Auth0's hosted login via PKCE
 *
 * POST /register, then GET /authorize
 *
 * Never resolves — the browser navigates away before any caller could act on a return value.
 */
const startLogin = async ({ silent = false } = {}): Promise<never> => {
  // Router's basename re-prepends APP_BASE on navigate, so strip it here to avoid /tools/tools/…
  const path = window.location.pathname.startsWith(APP_BASE)
    ? window.location.pathname.slice(APP_BASE.length) || "/"
    : window.location.pathname
  sessionStorage.setItem(RETURN_TO_KEY, `${ path }${ window.location.search }`)

  const client = await fetch(`${ ORIGIN }/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ redirect_uris: [REDIRECT_URI] }),
  }).then((res) => res.json())

  sessionStorage.setItem(CLIENT_KEY, client.client_id)

  const verifier = randomString(32)
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  const state = randomString(16)
  sessionStorage.setItem(STATE_KEY, state)

  const challenge = await sha256Base64Url(verifier)

  const url = new URL(`${ ORIGIN }/authorize`)
  url.searchParams.set("client_id", client.client_id)
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("code_challenge", challenge)
  url.searchParams.set("code_challenge_method", "S256")
  url.searchParams.set("state", state)
  if(silent) url.searchParams.set("prompt", "none")

  window.location.href = url.toString()

  return new Promise<never>(() => {})
}