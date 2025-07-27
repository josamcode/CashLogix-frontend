import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthContext";
import { getMessaging, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

let messaging;
let app;
try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.log("Firebase not initialized:", error);
}

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    password2: "",
    usertype: "user"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword2, setGeneratedPassword2] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestNotificationPermission = async (authToken) => {
    try {
      if (!messaging) {
        console.log("Firebase messaging not available");
        return;
      }
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered successfully');
        } catch (swError) {
          console.log('Service Worker registration failed:', swError);
        }
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: `${process.env.REACT_APP_VAPID_PUBLIC_KEY}`,
        });
        await axios.post(
          `${process.env.REACT_APP_API_URL}/save-fcm-token`,
          { fcmToken: token },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            }
          }
        );
        console.log("FCM Token saved successfully");
      }
    } catch (err) {
      console.error("Error getting FCM token:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      usertype: e.target.value,
    }));
  };

  const validateForm = () => {
    let phone = formData.phone;
    phone = normalizeEgyptPhone(phone);
    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      setError(t("error_invalid_phone_format"));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t("error_password_min_length"));
      return false;
    }
    if (formData.username.length < 8) {
      setError(t("error_username_min_length"));
      return false;
    }
    return true;
  };

  const normalizeEgyptPhone = (phone) => {
    if (phone.startsWith("20")) {
      return "0" + phone.slice(2);
    }
    return phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizeEgyptPhone(formData.phone);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          ...formData,
          phone: normalizedPhone,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      const token = res.data.token;
      login(token);
      setGeneratedPassword2(res.data.result.password2);
      setSuccess(t("success_registration"));
      await requestNotificationPermission(token);
      setFormData({ username: "", phone: "", password: "", password2: "", usertype: "" });
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        t("error_generic");
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen-minus-70 flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          {t("register_to_cashlogix")}
        </h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success ? (
          <div className="bg-green-100 text-green-800 p-3 rounded text-sm mb-3">
            {success}
            <br />
            <strong>{t("password2_label")}:</strong>{" "}
            <span className="text-red-700">{generatedPassword2}</span> <br />
            <span className="text-xs">
              {t("supervisor_login_info")}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("full_name")}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                placeholder={t("placeholder_full_name")}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("phone")}
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("placeholder_phone")}
                maxLength={11}
                pattern="01[0-9]{9}"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  placeholder={t("placeholder_password")}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500"
                  aria-label={showPassword ? t("aria_hide_password") : t("aria_show_password")}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("password2_optional")}
              </label>
              <input
                type="text"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder={t("placeholder_password2")}
              />
            </div>
            <div>
              <span className="block mb-3 font-semibold text-gray-700">
                {t("select_your_role")}
              </span>
              <div className="flex gap-3">
                <label
                  className={`cursor-pointer flex items-center justify-center gap-3 px-5 py-3 rounded-lg border transition flex-1
        ${formData.usertype === "user"
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                    }`}
                >
                  <input
                    type="radio"
                    name="usertype"
                    value="user"
                    checked={formData.usertype === "user"}
                    onChange={handleTypeChange}
                    className="hidden"
                  />
                  <span className="font-medium text-lg">{t("user")}</span>
                </label>
                <label
                  className={`cursor-pointer flex items-center justify-center gap-3 px-5 py-3 rounded-lg border transition flex-1
        ${formData.usertype === "entrepreneur"
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-green-500"
                    }`}
                >
                  <input
                    type="radio"
                    name="usertype"
                    value="entrepreneur"
                    checked={formData.usertype === "entrepreneur"}
                    onChange={handleTypeChange}
                    className="hidden"
                  />
                  <span className="font-medium text-lg">{t("entrepreneur")}</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
            >
              {loading ? t("registering") : t("register")}
            </button>
          </form>
        )}
        {!success ? (
          <p className="mt-4 text-center text-sm text-gray-600">
            {t("already_have_account_prompt")}{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline cursor-pointer font-medium"
            >
              {t("login")}
            </span>
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-gray-600">
            {t("go_back_to")}{" "}
            <span
              onClick={() => navigate("/")}
              className="text-green-600 hover:underline cursor-pointer font-medium"
            >
              {t("home_page")}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;