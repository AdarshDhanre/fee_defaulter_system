"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CreditCard, Mail } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [rollNo, setRollNo] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear saved session data on page mount
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        getBackendUrl("/api/auth/student-login"),
        {
          roll_no: rollNo,
          email: studentEmail,
        },
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "STUDENT");
      localStorage.setItem("userId", response.data.id.toString());
      localStorage.setItem("userName", response.data.name);

      router.push("/student-dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Invalid Roll Number or Email. Please check!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#6dd5ed] font-poppins p-4">
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
              Student Portal
            </h2>

            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Student Login Form */}
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
                {loading ? "Signing in..." : "Login"}
              </button>

              <div className="text-center text-xs mt-6 text-[#8b8b99]">
                Note : Contact to student section if you cannot access.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
