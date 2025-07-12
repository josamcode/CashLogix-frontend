// Header.jsx
import { useContext, useMemo, useState } from "react";
import {
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
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
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/reports" className="hover:underline">
            Reports
          </Link>
          <Link to="/settings" className="hover:underline">
            Settings
          </Link>
          {/* <button onClick={logout} className="hover:underline">
            Logout
          </button> */}
          <Link to="/profile">
            <UserCircleIcon className="h-7 w-7 text-textMain" />
          </Link>
        </>
      );
    } else {
      return (
        <>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/register" className="hover:underline">
            Register
          </Link>
        </>
      );
    }
  }, [isLoggedIn]);

  return (
    <header className="bg-bgMain text-textMain shadow">
      <div className="container max-w-7xl m-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-semibold font-kanit">
          CashLogix
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-medium">
          {menuLinks}
        </nav>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-7 w-7 text-textMain" />
          ) : (
            <Bars3Icon className="h-7 w-7 text-textMain" />
          )}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden px-4 pb-4">
          <nav className="flex flex-col gap-4 font-medium">{menuLinks}</nav>
        </div>
      )}
    </header>
  );
};

export default Header;
