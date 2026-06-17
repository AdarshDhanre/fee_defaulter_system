"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CreditCard, Mail } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [rollNo, setRollNo] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Signing in...");
  const [serverStatus, setServerStatus] = useState<"checking" | "warm" | "cold">("checking");
  const loadingTimerRef = useRef<NodeJS.Timeout[]>([]);

  // 🔥 Silently ping backend on mount to trigger cold start early
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

  // Cleanup timers
  useEffect(() => {
    return () => {
      loadingTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoadingMsg("Signing in...");

    const t1 = setTimeout(() => setLoadingMsg("Server waking up... ☕"), 3000);
    const t2 = setTimeout(() => setLoadingMsg("Almost there, hang on..."), 8000);
    const t3 = setTimeout(() => setLoadingMsg("Still connecting (Render cold start)..."), 15000);
    loadingTimerRef.current = [t1, t2, t3];

    try {
      const response = await axios.post(
        getBackendUrl("/api/auth/student-login"),
        {
          roll_no: rollNo,
          email: studentEmail,
        },
        { timeout: 60000 }, // 60s timeout for cold starts
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "STUDENT");
      localStorage.setItem("userId", response.data.id.toString());
      localStorage.setItem("userName", response.data.name);

      router.push("/student-dashboard");
    } catch (err: any) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is starting up. Please wait a moment and try again!");
      } else {
        setError(
          err.response?.data?.error ||
            "Invalid Roll Number or Email. Please check!",
        );
      }
    } finally {
      loadingTimerRef.current.forEach(clearTimeout);
      setLoading(false);
      setLoadingMsg("Signing in...");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#6dd5ed] font-poppins p-4">
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
              Student Portal
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
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="relative w-full">
                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Roll Number"
                  required
                />
              </div>

              <div className="relative w-full">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-sm text-white placeholder-[#8b8b99] focus:outline-none focus:bg-[#32324e] focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all"
                  placeholder="Registered Email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-[150px] py-3 bg-gradient-to-r from-[#1e3c72] to-[#2a5298] hover:from-[#2a5298] hover:to-[#1e3c72] text-white rounded-[30px] font-semibold block mx-auto mt-6 shadow-[0_10px_20px_rgba(30,60,114,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(30,60,114,0.4)] active:translate-y-0 disabled:opacity-50 transition-all"
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

              {/* Progressive cold-start hint */}
              {loading && (
                <p className="text-center text-[10px] text-slate-500 animate-pulse mt-1">
                  {loadingMsg}
                </p>
              )}

              <div className="text-center text-xs mt-6 text-[#8b8b99]">
                Note: Contact student section if you cannot access.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
