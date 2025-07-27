import { useTranslation } from 'react-i18next'; // Added import for useTranslation
import { useContext, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { t } = useTranslation(); // Added useTranslation hook
  const { token, loadingToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loadingToken || !token) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/getUser`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(res.data.user);
        setError(null);
        navigate("/dashboard");
      } catch (err) {
        setError(err.response?.data?.message || t("error_load_user_data")); // Translated error message
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, loadingToken, t, navigate]); // Added t and navigate to dependency array

  const totalMonthly = useMemo(() => {
    if (!user?.expenses) return 0;
    const now = new Date();
    return user.expenses
      .filter(
        (e) =>
          new Date(e.date).getMonth() === now.getMonth() &&
          new Date(e.date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, e) => sum + e.amount, 0);
  }, [user]);

  const totalAllTime = useMemo(() => {
    if (!user?.expenses) return 0;
    return user.expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [user]);

  if (loading || loadingToken)
    return <div className="p-10 text-center text-gray-500">{t("loading")}</div>; {/* Translated loading text */ }
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;
  // Removed duplicate error check

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-800">
      {/* Hero Section */}
      {!user && (
        <>
          <section
            className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white py-28 px-6 text-center overflow-hidden"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1470&q=80')",
              backgroundBlendMode: "multiply",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="relative z-10 max-w-7xl mx-auto">
              <h1 className="text-6xl font-extrabold leading-tight mb-4 drop-shadow-lg">
                {/* Translated welcome message */}
                {user
                  ? `${t("welcome_back")}, ${user?.username.split(" ")[0]}!`
                  : t("welcome_to_cashlogix")}
              </h1>
              <p className="text-xl mb-8 max-w-3xl mx-auto drop-shadow-md">
                {/* Translated hero description */}
                {t("hero_description")}
              </p>
              <div className="flex justify-center gap-6 flex-wrap">
                <Link
                  to="/dashboard"
                  className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                  aria-label={t("aria_label_go_to_dashboard")}
                >
                  {/* Translated button text */}
                  {t("go_to_dashboard")}
                </Link>
                <Link
                  to="/reports"
                  className="border border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-blue-700 transition transform hover:-translate-y-1"
                  aria-label={t("aria_label_view_reports")} 
                >
                  {/* Translated button text */}
                  {t("view_reports")}
                </Link>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black opacity-40"
              style={{ mixBlendMode: "multiply" }}
            />
          </section>
          <section className="py-20 px-6 max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              {/* Translated section title */}
              {t("why_choose_us")}
            </h2>
            <p className="text-lg max-w-4xl mx-auto mb-16 text-gray-600 leading-relaxed">
              {/* Translated section description */}
              {t("why_choose_us_description")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
              {/* Translated feature cards */}
              {[
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-blue-600 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  title: t("feature_simple_title"),
                  desc: t("feature_simple_desc"),
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-green-600 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 17l-4-4m0 0l4-4m-4 4h14"
                      />
                    </svg>
                  ),
                  title: t("feature_detailed_reports_title"),
                  desc: t("feature_detailed_reports_desc"),
                },
                {
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-yellow-500 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 20h16v-2a6 6 0 00-12 0v2z"
                      />
                    </svg>
                  ),
                  title: t("feature_secure_title"),
                  desc: t("feature_secure_desc"),
                },
              ].map(({ icon, title, desc }, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-lg p-8 shadow hover:shadow-lg transition cursor-default"
                  tabIndex={0}
                  role="region"
                  aria-label={title}
                >
                  {icon}
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {/* Quick Links Cards Section */}
      <section
        className={`bg-gray-100 ${user ? "min-h-screen flex items-center" : "py-20"
          }`}
      >
        <div className={`max-w-7xl mx-auto px-6 text-center flex-grow`}>
          <h2 className="text-4xl font-bold mb-10 text-gray-900">
            {/* Translated section title */}
            {t("quick_access")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* Translated quick links */}
            {[
              {
                title: t("dashboard"),
                desc: t("quick_access_dashboard_desc"),
                to: "/dashboard",
                color: "blue",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 mb-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3v18h18"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 9h6v6H9z"
                    />
                  </svg>
                ),
              },
              {
                title: t("reports"),
                desc: t("quick_access_reports_desc"),
                to: "/reports",
                color: "green",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 mb-4 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 17l-4-4m0 0l4-4m-4 4h14"
                    />
                  </svg>
                ),
              },
              {
                title: t("my_profile"),
                desc: t("quick_access_profile_desc"),
                to: "/profile",
                color: "gray",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 mb-4 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.343 6.932L12 14z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14v7m0-7L5.84 7.578"
                    />
                  </svg>
                ),
              },
            ].map(({ title, desc, to, color, icon }, i) => (
              <Link
                key={i}
                to={to}
                className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-${color}-500 flex flex-col items-center`}
                aria-label={title} // Translated aria label
              >
                {icon}
                <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                  {title}
                </h3>
                <p className="text-gray-600 max-w-xs">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {!user && (
        <section className="py-20 max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12 text-gray-900">
            {t("what_our_users_say")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                name: "Amira A.",
                comment:
                  "This app made managing my expenses so easy and stress-free! Highly recommended.",
                avatar: "https://randomuser.me/api/portraits/women/68.jpg",
              },
              {
                name: "Mohamed S.",
                comment:
                  "The reports feature helped me understand my spending habits better than ever.",
                avatar: "https://randomuser.me/api/portraits/men/75.jpg",
              },
              {
                name: "Sara M.",
                comment:
                  "Simple, intuitive, and powerful. This is exactly what I needed for my personal finances.",
                avatar: "https://randomuser.me/api/portraits/women/65.jpg",
              },
            ].map(({ name, comment, avatar }, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg p-6 shadow hover:shadow-lg transition"
                role="article"
                tabIndex={0}
              >
                <img
                  src={avatar}
                  alt={`Avatar of ${name}`}
                  className="mx-auto w-20 h-20 rounded-full mb-4 object-cover"
                  loading="lazy"
                />
                <p className="italic text-gray-700 mb-4">
                  &quot;{comment}&quot;
                </p>
                <p className="font-semibold text-gray-900">{name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;