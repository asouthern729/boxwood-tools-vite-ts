// Types
import type * as AuthTypes from './types'

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

const ORIGIN = window.location.origin
const REDIRECT_URI = `${ ORIGIN }${ import.meta.env.VITE_APP_BASE }/login`

const TOKEN_KEY = "boxwood_tools_token"
const CLIENT_KEY = "boxwood_tools_client_id"
const VERIFIER_KEY = "boxwood_tools_code_verifier"
const STATE_KEY = "boxwood_tools_oauth_state"
const RETURN_TO_KEY = "boxwood_tools_return_to"

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
const startLogin = async (): Promise<never> => {
  sessionStorage.setItem(RETURN_TO_KEY, `${ window.location.pathname }${ window.location.search }`)

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

  window.location.href = url.toString()

  return new Promise<never>(() => {})
}