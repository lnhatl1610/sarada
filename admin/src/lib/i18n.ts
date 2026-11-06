import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

void i18n.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
  returnNull: false,
})

let languageRequest = 0

export async function changeAdminLanguage(locale: 'vi' | 'en'): Promise<'vi' | 'en'> {
  const request = ++languageRequest
  let activeLocale = locale

  if (locale === 'en' && !i18n.hasResourceBundle('en', 'translation')) {
    try {
      const { default: english } = await import('./i18n.en')
      i18n.addResourceBundle('en', 'translation', english, true, true)
    } catch {
      activeLocale = 'vi'
    }
  }

  if (request !== languageRequest) {
    return i18n.language.startsWith('en') ? 'en' : 'vi'
  }

  await i18n.changeLanguage(activeLocale)

  return activeLocale
}

export default i18n
