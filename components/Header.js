import useTranslation from 'next-translate/useTranslation'
import { useRouter } from 'next/router'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'

export default function Header({ isHome }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { locale, locales, defaultLocale } = router

  const changeLanguage = (e) => {
    const locale = e.target.value
    router.push(router.asPath, router.asPath, { locale })
  }

  return (
    <>
      <header
        className={`w-full ${
          isHome ? 'fixed' : 'sticky'
        } z-30 top-0 flex items-center justify-between py-4 bg-white dark:bg-violet-1000 bg-opacity-30 dark:bg-opacity-30 backdrop-blur-lg firefox:bg-opacity-100 dark:firefox:bg-opacity-100`}
      >
        <nav className="w-full max-w-3xl mx-auto px-4 sm:px-6 sm:py-2 xl:max-w-5xl xl:px-0 flex items-center justify-between">
          <div className="w-full flex items-center justify-between text-base leading-5">
            <div className="hidden sm:block">
              {headerNavLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="p-1 font-medium text-gray-900 sm:p-4 dark:text-gray-100"
                >
                  {t(`headerNavLinks:${link.title.toLowerCase()}`)}
                </Link>
              ))}
            </div>
            <div className="flex">
              <select
                onChange={changeLanguage}
                defaultValue={locale}
                style={{ textAlignLast: 'center' }}
                className="text-gray-900 dark:text-gray-100 text-shadow-sm text-sm bg-transparent tracking-wide"
              >
                {locales.map((e) => (
                  <option
                    className="text-gray-900 dark:text-gray-100 dark:bg-gray-900 bg-gray-100"
                    classsvalue={e}
                    key={e}
                  >
                    {e}
                  </option>
                ))}
              </select>
              <ThemeSwitch />
            </div>
          </div>
          <MobileNav />
        </nav>
      </header>
    </>
  )
}
