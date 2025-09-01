/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_VERSION: string
  readonly VITE_CLOUDFLARE_ACCOUNT_ID: string
  readonly VITE_ENABLE_DEV_TOOLS: string
  // 更多環境變數...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}