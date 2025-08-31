import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// 翻譯資源
import zhTW from './locales/zh-TW.json'
import enUS from './locales/en-US.json'

const resources = {
  'zh-TW': {
    translation: zhTW
  },
  'en-US': {
    translation: enUS
  }
}

i18n
  .use(Backend) // 後端加載
  .use(LanguageDetector) // 語言檢測
  .use(initReactI18next) // 初始化 react-i18next
  .init({
    // 預設語言
    fallbackLng: 'zh-TW',
    debug: import.meta.env.DEV,
    
    // 資源
    resources,
    
    // 命名空間
    ns: ['translation'],
    defaultNS: 'translation',
    
    // 插值選項
    interpolation: {
      escapeValue: false, // React 已經安全處理
    },
    
    // 語言檢測選項
    detection: {
      order: [
        'localStorage',
        'sessionStorage', 
        'navigator',
        'htmlTag',
        'path',
        'subdomain'
      ],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    // 後端選項
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // React 選項
    react: {
      useSuspense: false,
    },
  })

export default i18n