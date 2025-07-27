// src/components/Header.jsx
import { useContext, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  LanguageIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { token } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const isLoggedIn = !!token;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);

    localStorage.setItem('preferredLanguage', newLang);

    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    if (newLang === 'ar') {
      document.documentElement.classList.remove('font-kanit');
      document.documentElement.classList.add('font-Rubik');
    } else {
      document.documentElement.classList.remove('font-Rubik');
      document.documentElement.classList.add('font-kanit');
    }
  };

  const menuLinks = useMemo(() => {
    if (isLoggedIn) {
      return (
        <>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <ChartBarIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">{t('dashboard')}</span>
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <DocumentTextIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">{t('reports')}</span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <Cog6ToothIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">{t('settings')}</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserCircleIcon className="h-6 w-6" />
            <span className="font-medium text-base md:hidden">{t('my_profile')}</span>
          </Link>
        </>
      );
    } else {
      return (
        <>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">{t('login')}</span>
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserPlusIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">{t('register')}</span>
          </Link>
        </>
      );
    }
  }, [isLoggedIn, t]);

  return (
    <header className="bg-bgMain text-textMain shadow relative z-50">
      <div className="container max-w-7xl m-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold font-kanit"> {/* Keep CashLogix in Kanit or make it dynamic too? */}
          CashLogix
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-medium">
          {menuLinks}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 text-textMain text-sm font-medium"
            aria-label={t('switch_language', { lng: i18n.language === 'en' ? 'Arabic' : 'English' })}
          >
            {i18n.language === 'en' ? 'AR' : 'EN'}
          </button>
        </nav>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(true)}
          aria-label={t('open_menu')}
        >
          <Bars3Icon className="h-7 w-7 text-textMain" />
        </button>
      </div>

      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className={`fixed top-0 left-0 w-full h-full bg-bgMain text-textMain p-6 transform transition-transform duration-300 ${isMenuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
        >
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('close_menu')}
              className="text-3xl text-textMain"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 font-medium text-lg">
            {menuLinks}
            <button
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 text-textMain text-lg font-medium"
              aria-label={t('switch_language', { lng: i18n.language === 'en' ? 'Arabic' : 'English' })}
            >
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;