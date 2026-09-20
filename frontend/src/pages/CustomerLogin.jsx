import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginCustomer,
} from "../services/customerAuthService";
import logo from "../assets/logo.png";
const CustomerLogin = () => {
  useEffect(() => {
    document.title = "OM Tiffin Service - Customer Login";
  }, []);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const token =
      sessionStorage.getItem("customerToken");
    if (token) {
      navigate("/customer/dashboard", {
        replace: true,
      });
    }
  }, [navigate]);
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await loginCustomer(
        userId.trim().toUpperCase(),
        password
      );
      sessionStorage.setItem(
        "customerToken",
        data.token
      );
      sessionStorage.setItem(
        "customerUser",
        JSON.stringify(data.customer)
      );
      if (data.customer?.isFirstLogin) {
        navigate("/customer/change-password", {
          replace: true,
        });
      } else {
        navigate("/customer/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Customer login failed"
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
            alt="OM Tiffin Service"
            className="w-28 h-28 rounded-full shadow-lg border-4 border-blue-100"
          />
        </div>
        <div className="text-center mt-5">
          <h1 className="text-3xl font-extrabold text-blue-700">
            OM TIFFIN SERVICE
          </h1>
          <p className="text-gray-500 mt-2">
            Customer Portal
          </p>
        </div>
        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Customer User ID
            </label>
            <input
              type="text"
              placeholder="Enter Customer ID"
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
          >
            {loading
              ? "Logging In..."
              : "Customer Login"}
          </button>
       <button
         type="button"
         onClick={() =>
           navigate("/customer-forgot-password")
         }
         className="w-full text-blue-700 hover:text-blue-900 font-semibold text-sm"
       >
         Forgot Password?
       </button>
      <button
        type="button"
        onClick={() =>
          navigate("/customer-forgot-user-id")
        }
        className="w-full text-blue-700 hover:text-blue-900 font-semibold text-sm"
      >
        Forgot User ID?
      </button>
              <button
        type="button"
        onClick={() =>
          navigate("/customer-account-setup")
        }
        className="w-full text-green-700 hover:text-green-900 font-semibold text-sm"
      >
        New Customer? Set Up Your Account
      </button>
</form>
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2026 OM Tiffin Service
        </div>
      </div>
    </div>
  );
};
export default CustomerLogin;





