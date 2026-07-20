"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { User, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Logging in...");
  const [serverStatus, setServerStatus] = useState<"checking" | "warm" | "cold">("checking");
  const loadingTimerRef = useRef<NodeJS.Timeout[]>([]);

  // 🔥 Silently ping backend on mount so cold start happens BEFORE user clicks Login
  useEffect(() => {
    localStorage.clear();

    const warmUp = async () => {
      try {
        // Try the dedicated health endpoint first, fallback to root
        await axios.get(getBackendUrl("/api/health"), { timeout: 10000 });
        setServerStatus("warm");
      } catch {
        try {
          // Fallback: ping root endpoint (always exists)
          await axios.get(getBackendUrl("/"), { timeout: 15000 });
          setServerStatus("warm");
        } catch {
          setServerStatus("cold");
        }
      }
    };
    warmUp();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      loadingTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoadingMsg("Logging in...");

    // Progressive messages for cold start awareness
    const t1 = setTimeout(() => setLoadingMsg("Server waking up... ☕"), 3000);
    const t2 = setTimeout(() => setLoadingMsg("Almost there, hang on..."), 8000);
    const t3 = setTimeout(() => setLoadingMsg("Still connecting (Render cold start)..."), 15000);
    loadingTimerRef.current = [t1, t2, t3];

    try {
      const response = await axios.post(getBackendUrl("/api/auth/login"), {
        username,
        password,
      }, { timeout: 60000 }); // 60s timeout for cold starts

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "ADMIN");
      localStorage.setItem("userId", response.data.id.toString());
      localStorage.setItem("userName", response.data.username);

      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is starting up (cold start). Please wait a moment and try again!");
      } else if (err.response?.status === 403 && err.response?.data?.email) {
        localStorage.setItem("verifyEmail", err.response.data.email);
        router.push("/verify");
        return;
      } else {
        setError(
          err.response?.data?.error ||
            "Invalid username or password. Check credentials!",
        );
      }
    } finally {
      loadingTimerRef.current.forEach(clearTimeout);
      setLoading(false);
      setLoadingMsg("Logging in...");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b52d1] via-[#b862c9] to-[#f77c8e] font-poppins p-4">
      <div className="w-[900px] max-w-[95%] h-auto md:h-[550px] flex flex-col md:flex-row bg-[#1e1e2f]/95 backdrop-blur-[10px] rounded-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 transition-all">
        {/* Left Side */}
        <div
          className="hidden md:block flex-1 bg-white m-[30px] rounded-[15px] bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: "url('/static/img/college_bg.jpg')" }}
        />

        {/* Right Side: Login Form */}
        <div className="flex-1 p-[40px_30px] md:p-[50px_40px] flex flex-col justify-center items-center bg-transparent relative">
          <div className="w-full max-w-[320px]">
            <h2 className="text-sm font-semibold text-[#e2d8fa] tracking-wider mb-2 text-center uppercase">
              Admin Login
            </h2>

            {/* Server status dot */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <div className={`w-2 h-2 rounded-full transition-all ${
                serverStatus === "warm"
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
                  : serverStatus === "cold"
                  ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                  : "bg-slate-500 animate-pulse"
              }`} />
              <span className="text-[10px] font-medium text-slate-500">
                {serverStatus === "warm"
                  ? "Server ready"
                  : serverStatus === "cold"
                  ? "Server cold — first login may be slow"
                  : "Checking server..."}
              </span>
            </div>

            {error && (
              <div className={`mb-5 p-3 rounded-xl text-xs text-center font-medium flex items-center justify-center gap-2 ${
                error.toLowerCase().includes("locked") || error.toLowerCase().includes("attempts")
                  ? "bg-amber-950/60 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-red-950/40 border border-red-500/30 text-red-300"
              }`}>
                {error.toLowerCase().includes("locked") && <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />}
                <span>{error}</span>
              </div>
            )}

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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-[150px] py-3 bg-gradient-to-r from-[#9b51e0] to-[#de5eb0] hover:from-[#de5eb0] hover:to-[#9b51e0] text-white rounded-[30px] font-semibold block mx-auto mt-6 shadow-[0_10px_20px_rgba(155,81,224,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(155,81,224,0.4)] active:translate-y-0 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </span>
                ) : "Login"}
              </button>

              {/* Progressive cold-start loading hint */}
              {loading && (
                <p className="text-center text-[10px] text-slate-500 animate-pulse mt-1 transition-all">
                  {loadingMsg}
                </p>
              )}

              <div className="flex flex-col gap-2 items-center text-xs mt-6 text-[#b39ddb]">
                <a href="/register" className="hover:text-[#de5eb0] transition-colors font-medium">
                  Create an Admin Account
                </a>
                <a href="/forgot-password" className="hover:text-[#de5eb0] transition-colors font-medium">
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
