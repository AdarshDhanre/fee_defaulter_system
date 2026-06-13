"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { KeyRound, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = request reset (email), 2 = verify OTP & reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/auth/forgot-password", {
        email,
      });

      setMessage("OTP verification code has been sent to your email!");
      setStep(2);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Email not found. Please try again!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        email,
        otp,
        password,
      });

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Reset failed. Check OTP code!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b52d1] via-[#b862c9] to-[#f77c8e] font-poppins p-4">
      {/* login-card container matching the original */}
      <div className="w-[900px] max-w-[95%] h-auto md:h-[550px] flex flex-col md:flex-row bg-[#1e1e2f]/95 backdrop-blur-[10px] rounded-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 transition-all animate-in fade-in duration-200">
        {/* Left Side: College Logo container with margin and white bg */}
        <div
          className="hidden md:block flex-1 bg-white m-[30px] rounded-[15px] bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: "url('/static/img/college_bg.jpg')" }}
        />

        {/* Right Side: Reset Form */}
        <div className="flex-1 p-[40px_30px] md:p-[50px_40px] flex flex-col justify-center items-center bg-transparent relative">
          <div className="w-full max-w-[320px]">
            {/* Header Text */}
            <h2 className="text-sm font-semibold text-[#e2d8fa] tracking-wider mb-2 text-center uppercase">
              Reset Password
            </h2>
            <p className="text-[11px] text-[#b39ddb] text-center mb-6 leading-relaxed">
              {step === 1
                ? "Enter your email address below, and we will send you a 6-digit OTP to reset your password."
                : "Enter the OTP code received in your email along with your new password."}
            </p>

            {message && (
              <div className="mb-5 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center font-medium">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {step === 1 ? (
              /* Step 1: Send Request */
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="relative w-full">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                    placeholder="Admin Email Address"
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block mt-6 shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="links-container mt-6 text-center text-xs text-[#b39ddb]">
                  Remember your password? <br />
                  <a
                    href="/login"
                    className="hover:text-[#de5eb0] transition-colors font-semibold text-sm inline-block mt-1"
                  >
                    Back to Log in
                  </a>
                </div>
              </form>
            ) : (
              /* Step 2: Input OTP & New Password */
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Hidden username field to prevent browser autofill from saving OTP as username */}
                <input
                  type="hidden"
                  name="username"
                  autoComplete="username"
                  value={email}
                />

                <div className="relative w-full">
                  <input
                    type="text"
                    name="otp"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full py-2.5 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white text-center font-bold tracking-[0.2em] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all placeholder-[#8b8b99] text-sm"
                    placeholder="OTP CODE"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="relative w-full">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-[50px] pr-[50px] py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                    placeholder="New Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8b8b99] hover:text-[#b39ddb] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="relative w-full">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                    placeholder="Confirm New Password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block mt-6 shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
