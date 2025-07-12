import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
    password2: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword2, setGeneratedPassword2] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Phone number is invalid. Must start with 01 and be 11 digits.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
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
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        formData,
        { headers: { "Content-Type": "application/json" } }
      );
      document.cookie = `token=${res.data.token}; path=/; max-age=31536000`;
      login(res.data.token);
      setGeneratedPassword2(res.data.result.password2);
      setSuccess("Registration successful!");
      setFormData({ username: "", phone: "", password: "", password2: "" });
    } catch (err) {
      setError(err.response?.data?.err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-minus-70 flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          Register to CashLogix ❤️
        </h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {success ? (
          <div className="bg-green-100 text-green-800 p-3 rounded text-sm mb-3">
            {success}
            <br />
            <strong>Password2:</strong>{" "}
            <span className="text-red-700">{generatedPassword2}</span> <br />
            <span className="text-xs">
              * Your supervisor should login using this password{" "}
              {generatedPassword2} and choose role "supervisor".
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... here keep all your input fields and submit button as is ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                placeholder="Enter your full name"
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  placeholder="********"
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500"
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
                Password 2 (Optional)
              </label>
              <input
                type="text"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Leave empty to auto-generate"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline cursor-pointer font-medium"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
