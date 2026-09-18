/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_APP_BASE: string
  readonly VITE_APP_TITLE: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_ENTRA_CLIENT_ID: string
  readonly VITE_AUTH_AUTHORITY: string
  readonly VITE_AUTH_REDIRECT_URI: string
  readonly VITE_AUTH_POST_LOGOUT_REDIRECT_URI: string
  readonly VITE_API_URL: string
  readonly VITE_MOCK_TOKEN: string
  readonly VITE_MOCK_DEPARTMENT: AppTypes.DepartmentType
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}