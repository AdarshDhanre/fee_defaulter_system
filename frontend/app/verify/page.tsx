"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { KeyRound, Mail, ArrowRight } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("verifyEmail");
    if (!storedEmail) {
      router.push("/register");
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/auth/verify-otp", {
        email,
        otp,
      });

      setSuccess(true);
      localStorage.removeItem("verifyEmail");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Invalid verification code. Try again!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b52d1] via-[#b862c9] to-[#f77c8e] font-poppins p-4">
      <div className="w-[420px] max-w-[95%] bg-[#1e1e2f]/95 backdrop-blur-[10px] p-8 md:p-10 rounded-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 text-center animate-in fade-in duration-200">
        <h2 className="text-lg font-semibold text-[#e2d8fa] tracking-wider mb-2 uppercase">
          📧 Verify Email
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Enter the 6-digit OTP sent to <br />
          <span className="text-[#b39ddb] font-bold">{email}</span>
        </p>

        {success ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold">
            🎉 Verification Successful! Redirecting...
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white text-center font-bold text-xl tracking-[0.3em] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all placeholder-[#8b8b99]"
                  placeholder="••••••"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Verifying..." : "Verify & Login"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-xs text-[#b39ddb]">
          <a
            href="/register"
            className="hover:text-[#de5eb0] transition-colors font-semibold"
          >
            Try a different email?
          </a>
        </div>
      </div>
    </div>
  );
}
