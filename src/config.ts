/**
 * App configuration, formerly the VITE_* values in .env files.
 *
 * Imported by both the app bundle and vite.config.ts, so keep it free of browser and Node APIs.
 */

/** Path the app is served under. Must match APP_BASE in the Dockerfile, which nginx uses. */
export const APP_BASE = "/tools/"

/** Local boxwood-mcp-ts the dev server proxies backend paths to. Dev only. */
export const DEV_API_TARGET = "http://127.0.0.1:3001"

/**
 * Public host when the dev server sits behind a TLS-terminating proxy
 * (https://build.tyneside.io/tools/ -> nginx -> 127.0.0.1:5173), so HMR connects over wss on 443.
 * Set to "" for plain localhost dev with Vite's default HMR. Dev only.
 */
export const DEV_PUBLIC_HOST = "build.tyneside.io"
