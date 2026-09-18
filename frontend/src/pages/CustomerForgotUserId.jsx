import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendCustomerUserIdRecoveryOtp,
  verifyCustomerUserIdRecoveryOtp,
} from "../services/customerAuthService";
import logo from "../assets/logo.png";
const CustomerForgotUserId = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert("Please enter a valid 10-digit WhatsApp number.");
      return;
    }
    try {
      setLoading(true);
      await sendCustomerUserIdRecoveryOtp(cleanPhone);
      setPhone(cleanPhone);
      setStep(2);
      alert("OTP sent to your registered WhatsApp number.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      setLoading(true);
      const data =
        await verifyCustomerUserIdRecoveryOtp(
          phone,
          otp.trim()
        );
      setUserId(data.userId || "");
      setStep(3);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "OTP verification failed"
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
            Forgot User ID
          </p>
        </div>
        {step === 1 && (
          <form
            onSubmit={handleSendOtp}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Registered WhatsApp Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="tel"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 disabled:bg-gray-400 shadow-lg"
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={handleVerifyOtp}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-[0.4em] font-bold"
                autoComplete="one-time-code"
                required
              />
            </div>
            <p className="text-center text-sm text-gray-500">
              OTP sent to ******{phone.slice(-4)}
            </p>
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
              onClick={() => {
                setStep(1);
                setOtp("");
              }}
              className="w-full text-blue-700 hover:text-blue-900 font-semibold text-sm"
            >
              Change Mobile Number
            </button>
          </form>
        )}
        {step === 3 && (
          <div className="mt-8 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-700 font-semibold">
                OTP Verified Successfully
              </p>
              <p className="text-gray-600 mt-4 text-sm">
                Your Customer User ID is
              </p>
              <div className="mt-3 bg-white border-2 border-green-300 rounded-xl px-4 py-4">
                <p className="text-2xl font-extrabold text-blue-700 tracking-wide">
                  {userId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/customer-login")}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg"
            >
              Back to Customer Login
            </button>
          </div>
        )}
        {step !== 3 && (
          <button
            type="button"
            onClick={() => navigate("/customer-login")}
            className="w-full mt-4 text-blue-700 hover:text-blue-900 font-semibold text-sm"
          >
            Back to Customer Login
          </button>
        )}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2026 OM Tiffin Service
        </div>
      </div>
    </div>
  );
};
export default CustomerForgotUserId;
