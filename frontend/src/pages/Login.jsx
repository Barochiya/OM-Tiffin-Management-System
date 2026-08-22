import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/authService";

import logo from "../assets/logo.png";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token =
      sessionStorage.getItem("token");

    if (token) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await loginAdmin(
        email,
        password
      );

      sessionStorage.setItem(
        "token",
        data.token
      );

      alert("✅ Login Successful");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="OM Tiffin"
            className="w-28 h-28 rounded-full shadow-lg border-4 border-blue-100"
          />
        </div>

        <div className="text-center mt-5">
          <h1 className="text-3xl font-extrabold text-blue-700">
            OM TIFFIN SERVICE
          </h1>

          <p className="text-gray-500 mt-2">
            Admin Panel Login
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Email
            </label>

            <div className="relative">
              <FaEnvelope className="absolute left-4 top-4 text-gray-400" />

              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <FaLock className="absolute left-4 top-4 text-gray-400" />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-4 text-gray-500"
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
          >
            {loading
              ? "Logging In..."
              : "Login"}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-gray-500">
          © 2026 OM Tiffin Service
        </div>
      </div>
    </div>
  );
};

export default Login;
