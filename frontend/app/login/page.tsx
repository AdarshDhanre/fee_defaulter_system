"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete saved login data/session on mount
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(getBackendUrl("/api/auth/login"), {
        username,
        password,
      });

      // Save session details
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "ADMIN");
      localStorage.setItem("userId", response.data.id.toString());
      localStorage.setItem("userName", response.data.username);

      router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.email) {
        localStorage.setItem("verifyEmail", err.response.data.email);
        router.push("/verify");
        return;
      }
      setError(
        err.response?.data?.error ||
          "Invalid username or password. Check credentials!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b52d1] via-[#b862c9] to-[#f77c8e] font-poppins p-4">
      {/* login-card container matching the original */}
      <div className="w-[900px] max-w-[95%] h-auto md:h-[550px] flex flex-col md:flex-row bg-[#1e1e2f]/95 backdrop-blur-[10px] rounded-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 transition-all">
        {/* Left Side: College Logo container with margin and white bg */}
        <div
          className="hidden md:block flex-1 bg-white m-[30px] rounded-[15px] bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: "url('/static/img/college_bg.jpg')" }}
        />

        {/* Right Side: Login Form */}
        <div className="flex-1 p-[40px_30px] md:p-[50px_40px] flex flex-col justify-center items-center bg-transparent relative">
          <div className="w-full max-w-[320px]">
            {/* Header Text */}
            <h2 className="text-sm font-semibold text-[#e2d8fa] tracking-wider mb-6 text-center uppercase">
              Admin Login
            </h2>

            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Admin Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative w-full">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Admin Username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="relative w-full">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-[50px] pr-[50px] py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Admin Password"
                  required
                  autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-[150px] py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block mx-auto mt-6 shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="flex flex-col gap-2 items-center text-xs mt-6 text-[#b39ddb]">
                <a
                  href="/register"
                  className="hover:text-[#de5eb0] transition-colors font-medium"
                >
                  Create an Admin Account
                </a>
                <a
                  href="/forgot-password"
                  className="hover:text-[#de5eb0] transition-colors font-medium"
                >
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
