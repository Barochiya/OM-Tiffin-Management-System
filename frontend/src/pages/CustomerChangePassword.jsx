import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  changeCustomerPassword,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const customerUser = JSON.parse(
    sessionStorage.getItem("customerUser") || "{}"
  );
  const isFirstLogin = customerUser?.isFirstLogin === true;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFirstLogin && !currentPassword) {
      alert("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    try {
      setLoading(true);
      await changeCustomerPassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      alert("Password changed successfully.");
      navigate("/customer/dashboard", {
        replace: true,
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", {
      replace: true,
    });
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            OM TIFFIN SERVICE
          </h1>
          <p className="text-blue-100">
            Customer Portal
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold"
        >
          Logout
        </button>
      </header>
      <main className="max-w-xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isFirstLogin
              ? "Set Your New Password"
              : "Change Password"}
          </h2>
          <p className="text-gray-500 mt-2">
            {isFirstLogin
              ? "Please create a new password to continue to your customer portal."
              : "Update your customer portal password."}
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
          {!isFirstLogin && (
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="current-password"
                required
              />
            </div>
          )}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 8 characters.
              </p>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
export default CustomerChangePassword;



