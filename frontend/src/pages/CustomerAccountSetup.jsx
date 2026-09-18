import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendCustomerAccountSetupOtp,
  verifyCustomerAccountSetupOtp,
  setCustomerAccountSetupPassword,
} from "../services/customerAuthService";
const CustomerAccountSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const normalizedUserId = userId.trim().toUpperCase();
    if (!normalizedUserId) {
      setMessage("Please enter your Customer User ID.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const data = await sendCustomerAccountSetupOtp(
        normalizedUserId
      );
      if (data.success) {
        setUserId(normalizedUserId);
        setStep(2);
        setMessage(
          data.message ||
            "Verification code sent to your WhatsApp."
        );
      } else {
        setMessage(
          data.message ||
            "Unable to send verification code."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit verification code.");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const data = await verifyCustomerAccountSetupOtp(
        userId.trim().toUpperCase(),
        otp.trim()
      );
      if (data.success && data.setupToken) {
        setSetupToken(data.setupToken);
        setStep(3);
        setOtp("");
        setMessage(
          "Verification successful. Please create your new password."
        );
      } else {
        setMessage(
          data.message ||
            "Unable to verify verification code."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to verify code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!setupToken) {
      setMessage(
        "Your account setup session is invalid. Please start again."
      );
      setStep(1);
      return;
    }
    if (newPassword.length < 8) {
      setMessage(
        "New password must be at least 8 characters."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage(
        "New password and confirm password do not match."
      );
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const data = await setCustomerAccountSetupPassword(
        userId.trim().toUpperCase(),
        setupToken,
        newPassword,
        confirmPassword
      );
      if (data.success) {
        setSetupToken("");
        setNewPassword("");
        setConfirmPassword("");
        sessionStorage.removeItem("customerAccountSetup");
        setMessage(
          "Password created successfully. Redirecting to Customer Login..."
        );
        setTimeout(() => {
          navigate("/customer-login", {
            replace: true,
          });
        }, 1200);
      } else {
        setMessage(
          data.message ||
            "Unable to create password."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleChangeUserId = () => {
    setStep(1);
    setOtp("");
    setSetupToken("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-700">
            OM TIFFIN SERVICE
          </h1>
          <p className="text-gray-500 mt-2">
            Customer Account Setup
          </p>
        </div>
        {step === 1 && (
          <form
            onSubmit={handleSendOtp}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Customer User ID
              </label>
              <input
                type="text"
                placeholder="Enter Customer User ID"
                value={userId}
                onChange={(e) =>
                  setUserId(e.target.value)
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="username"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all disabled:bg-gray-400"
            >
              {loading
                ? "Sending..."
                : "Send Verification Code"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/customer-login")
              }
              className="w-full text-blue-700 font-semibold text-sm"
            >
              Back to Customer Login
            </button>
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={handleVerifyOtp}
            className="mt-8 space-y-5"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Verification code sent to your
                registered WhatsApp number.
              </p>
              <p className="font-bold text-blue-700 mt-1">
                {userId}
              </p>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className="w-full px-4 py-3 border rounded-xl text-center tracking-[0.5em] text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="one-time-code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={
                loading || otp.length !== 6
              }
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all disabled:bg-gray-400"
            >
              {loading
                ? "Verifying..."
                : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={handleChangeUserId}
              className="w-full text-blue-700 font-semibold text-sm"
            >
              Change User ID
            </button>
          </form>
        )}
        {step === 3 && (
          <form
            onSubmit={handleSetPassword}
            className="mt-8 space-y-5"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Verification successful for
              </p>
              <p className="font-bold text-blue-700 mt-1">
                {userId}
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Create a new password to activate
                your customer portal account.
              </p>
            </div>
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Creating Password..."
                : "Create Password"}
            </button>
          </form>
        )}
        {message && (
          <div className="mt-5 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm text-center">
            {message}
          </div>
        )}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2026 OM Tiffin Service
        </div>
      </div>
    </div>
  );
};
export default CustomerAccountSetup;
