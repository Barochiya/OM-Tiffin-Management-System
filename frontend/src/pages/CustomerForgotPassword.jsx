import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendCustomerPasswordResetOtp,
  verifyCustomerPasswordResetOtp,
  resetCustomerPassword,
} from "../services/customerAuthService";
import logo from "../assets/logo.png";
const CustomerForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const normalizedUserId = userId.trim().toUpperCase();
  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setResendSeconds((seconds) =>
        seconds > 0 ? seconds - 1 : 0
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!normalizedUserId) {
      setError("Please enter your Customer User ID.");
      return;
    }
    try {
      setLoading(true);
      const data = await sendCustomerPasswordResetOtp(
        normalizedUserId
      );
      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to send OTP."
        );
      }
      setStep(2);
      setMessage(
        data.message ||
          "OTP sent to your registered WhatsApp number."
      );
      setResendSeconds(
        Number(data.resendAfterSeconds || 60)
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to send OTP. Please try again."
      );
      if (
        error.response?.data?.code ===
        "OTP_RESEND_COOLDOWN"
      ) {
        setResendSeconds(
          Number(
            error.response.data.retryAfterSeconds || 60
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    try {
      setLoading(true);
      const data =
        await verifyCustomerPasswordResetOtp(
          normalizedUserId,
          otp.trim()
        );
      if (!data?.success || !data?.resetToken) {
        throw new Error(
          data?.message || "OTP verification failed."
        );
      }
      setResetToken(data.resetToken);
      setStep(3);
      setMessage(
        "OTP verified successfully. Please create your new password."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters long."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }
    try {
      setLoading(true);
      const data = await resetCustomerPassword(
        normalizedUserId,
        resetToken,
        newPassword,
        confirmPassword
      );
      if (!data?.success) {
        throw new Error(
          data?.message || "Password reset failed."
        );
      }
      setStep(4);
      setMessage(
        "Password reset successfully. You can now log in."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleResendOtp = async () => {
    if (resendSeconds > 0 || resendLoading) {
      return;
    }
    setError("");
    setMessage("");
    try {
      setResendLoading(true);
      const data =
        await sendCustomerPasswordResetOtp(
          normalizedUserId
        );
      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to resend OTP."
        );
      }
      setMessage(
        data.message ||
          "A new OTP has been sent to your registered WhatsApp number."
      );
      setResendSeconds(
        Number(data.resendAfterSeconds || 60)
      );
      setOtp("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to resend OTP. Please try again."
      );
      if (
        error.response?.data?.code ===
        "OTP_RESEND_COOLDOWN"
      ) {
        setResendSeconds(
          Number(
            error.response.data.retryAfterSeconds || 60
          )
        );
      }
    } finally {
      setResendLoading(false);
    }
  };
  const goToLogin = () => {
    navigate("/customer-login", {
      replace: true,
    });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="OM Tiffin Service"
            className="w-24 h-24 rounded-full shadow-lg border-4 border-blue-100"
          />
        </div>
        <div className="text-center mt-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700">
            OM TIFFIN SERVICE
          </h1>
          <p className="text-gray-500 mt-2">
            Customer Portal
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-6">
            Forgot Password
          </h2>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-2 rounded-full transition-all duration-300 ${
                item <= step
                  ? "w-16 bg-blue-700"
                  : "w-10 bg-gray-200"
              }`}
            />
          ))}
        </div>
        {message && (
          <div className="mt-6 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        {step === 1 && (
          <form
            onSubmit={handleSendOtp}
            className="mt-7 space-y-5"
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
            <p className="text-sm text-gray-500">
              We will send a verification OTP to your
              registered WhatsApp number.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Sending OTP..."
                : "Send WhatsApp OTP"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={handleVerifyOtp}
            className="mt-7 space-y-5"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Customer User ID
              </label>
              <input
                type="text"
                value={normalizedUserId}
                readOnly
                className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-gray-600 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                WhatsApp OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-[0.4em] text-lg font-bold"
                autoComplete="one-time-code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={
                resendSeconds > 0 || resendLoading
              }
              className="w-full border-2 border-blue-700 text-blue-700 hover:bg-blue-50 py-3 rounded-xl font-bold transition-all duration-300 disabled:border-gray-300 disabled:text-gray-400"
            >
              {resendLoading
                ? "Resending..."
                : resendSeconds > 0
                ? `Resend OTP in ${resendSeconds}s`
                : "Resend OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
                setMessage("");
              }}
              className="w-full text-gray-500 hover:text-blue-700 text-sm font-semibold"
            >
              Change User ID
            </button>
          </form>
        )}
        {step === 3 && (
          <form
            onSubmit={handleResetPassword}
            className="mt-7 space-y-5"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
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
            <p className="text-sm text-gray-500">
              Password must be at least 8 characters long.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
          </form>
        )}
        {step === 4 && (
          <div className="mt-7 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-gray-800 mt-5">
              Password Updated
            </h3>
            <p className="text-gray-500 mt-2">
              Your Customer Portal password has been
              changed successfully.
            </p>
            <button
              type="button"
              onClick={goToLogin}
              className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg"
            >
              Go to Customer Login
            </button>
          </div>
        )}
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={goToLogin}
            className="text-blue-700 hover:text-blue-900 font-semibold text-sm"
          >
            ← Back to Customer Login
          </button>
        </div>
        <div className="text-center mt-5 text-sm text-gray-500">
          © 2026 OM Tiffin Service
        </div>
      </div>
    </div>
  );
};
export default CustomerForgotPassword;

