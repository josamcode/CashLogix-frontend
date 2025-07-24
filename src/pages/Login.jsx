import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

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
  console.log("Firebase not initialized in Login:", error);
}

const Login = () => {
  const navigate = useNavigate();
  const { login, token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestNotificationPermission = async (authToken) => {
    try {
      if (!messaging) {
        console.log("Firebase messaging not available in Login");
        return;
      }

      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered successfully in Login');
        } catch (swError) {
          console.log('Service Worker registration failed in Login:', swError);
        }
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
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
        console.log("FCM Token saved successfully in Login");
      }
    } catch (err) {
      console.error("Error getting FCM token in Login:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhoneChange = (phone) => {
    setFormData((prev) => ({ ...prev, phone: phone }));
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }));
  };

  const validateForm = () => {
    const phoneRegex = /^01[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError(
        "Phone number is invalid. Must be an Egyptian number starting with 01 and 11 digits."
      );
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        formData
      );

      document.cookie = `token=${res.data.token}; path=/; max-age=31536000`;
      if (formData.role) {
        document.cookie = `role=${formData.role}; path=/; max-age=31536000`;
      }

      login(res.data.token);

      await requestNotificationPermission(res.data.token);

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Error while login!");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          Welcome Back 👋
        </h2>

        {error && (
          <p className="mb-6 text-red-600 font-medium text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              pattern="01[0-9]{9}"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Password with eye icon */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                placeholder="********"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-6 w-6" />
                ) : (
                  <EyeIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Role selection modern */}
          <div>
            <span className="block mb-3 font-semibold text-gray-700">
              Select Role
            </span>
            <div className="flex gap-3">
              <label
                className={`cursor-pointer flex items-center justify-center gap-3 px-5 py-3 rounded-lg border transition flex-1
        ${formData.role === "user"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-500"
                  }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === "user"}
                  onChange={handleRoleChange}
                  className="hidden"
                />
                <span className="font-medium text-lg">User</span>
              </label>

              <label
                className={`cursor-pointer flex items-center justify-center gap-3 px-5 py-3 rounded-lg border transition flex-1
        ${formData.role === "supervisor"
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-green-500"
                  }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="supervisor"
                  checked={formData.role === "supervisor"}
                  onChange={handleRoleChange}
                  className="hidden"
                />
                <span className="font-medium text-lg">Supervisor</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          You don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline cursor-pointer font-medium"
          >
            Create one
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
