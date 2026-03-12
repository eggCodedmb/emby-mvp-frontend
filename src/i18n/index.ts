import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export type AppLocale = 'zh-CN' | 'en'

export const LOCALE_STORAGE_KEY = 'app-locale'
const FALLBACK_LOCALE: AppLocale = 'zh-CN'

const normalizeLocale = (input: string | null | undefined): AppLocale => {
  if (input === 'en') return 'en'
  return 'zh-CN'
}

const readSavedLocale = () => normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))

const defaultLocale = readSavedLocale() || FALLBACK_LOCALE

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export const applyLocale = (nextLocale: string) => {
  const normalized = normalizeLocale(nextLocale)
  i18n.global.locale.value = normalized
  localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
  document.documentElement.lang = normalized
}

applyLocale(defaultLocale)
