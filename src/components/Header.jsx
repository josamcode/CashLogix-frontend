import { useContext, useMemo, useState } from "react";
import {
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { token, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = !!token;

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
            <span className="font-medium text-base">Dashboard</span>
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <DocumentTextIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">Reports</span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <Cog6ToothIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">Settings</span>
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserCircleIcon className="h-6 w-6" />
            <span className="font-medium text-base  md:hidden">My Profile</span>
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
            <span className="font-medium text-base">Login</span>
          </Link>

          <Link
            to="/register"
            className="flex items-center gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-200 transition-colors duration-300 px-3 py-2 text-textMain"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserPlusIcon className="h-6 w-6 md:hidden" />
            <span className="font-medium text-base">Register</span>
          </Link>
        </>
      );
    }
  }, [isLoggedIn]);

  return (
    <header className="bg-bgMain text-textMain shadow relative z-50">
      <div className="container max-w-7xl m-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold font-kanit">
          CashLogix
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-medium">
          {menuLinks}
        </nav>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Bars3Icon className="h-7 w-7 text-textMain" />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`fixed top-0 left-0 w-full h-full bg-bgMain text-textMain p-6 transform transition-transform duration-300 ${
            isMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="text-3xl text-textMain"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 font-medium text-lg">
            {menuLinks}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
