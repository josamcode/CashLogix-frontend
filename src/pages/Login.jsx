import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    role: "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        formData
      );

      document.cookie = `token=${res.data.token}; path=/; max-age=31536000`;
      document.cookie = `role=${formData.role}; path=/; max-age=31536000`;

      login(res.data.token);

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Error while login!");
    } finally {
      setLoading(false);
    }
  };

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
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        ${
          formData.role === "user"
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
        ${
          formData.role === "supervisor"
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
