"use client";
import { getBackendUrl } from "@/utils/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(getBackendUrl("/api/auth/register"), {
        username,
        email,
        password,
      });

      // Save registering email to session so we can verify OTP on next page
      localStorage.setItem("verifyEmail", email);
      router.push("/verify");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Try again!");
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

        {/* Right Side: Register Form */}
        <div className="flex-1 p-[40px_30px] md:p-[50px_40px] flex flex-col justify-center items-center bg-transparent relative">
          <div className="w-full max-w-[320px]">
            {/* Header Text */}
            <h2 className="text-sm font-semibold text-[#e2d8fa] tracking-wider mb-6 text-center uppercase">
              Create Admin Account
            </h2>

            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative w-full">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Choose a Username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="relative w-full">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Email Address"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="relative w-full">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Create Password"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block mt-6 shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Sending OTP..." : "Sign Up & Verify"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="links-container mt-6 text-center text-xs text-[#b39ddb]">
                Already have an account? <br />
                <a
                  href="/login"
                  className="hover:text-[#de5eb0] transition-colors font-semibold text-sm inline-block mt-1"
                >
                  Log in here
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
