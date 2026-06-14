"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Calendar, Save, ArrowLeft, Loader2 } from "lucide-react";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  branch: string;
  category: string;
}

export default function AddFeePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [totalFee, setTotalFee] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [isFetchingFee, setIsFetchingFee] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchStudents();
    }
  }, [router]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(getBackendUrl("/api/students"));
      setStudents(response.data);

      // Pre-set deadline if there is a previous record
      const feesRes = await axios.get(getBackendUrl("/api/fees"));
      if (feesRes.data && feesRes.data.length > 0) {
        // Find last fee record deadline
        const lastRecord = feesRes.data[feesRes.data.length - 1];
        if (lastRecord.deadline) {
          setDeadline(lastRecord.deadline.split("T")[0]);
        }
      }
    } catch (err) {
      setError("Failed to load students data.");
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch course fee when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      fetchAutoFee(selectedStudentId);
    } else {
      setTotalFee("");
    }
  }, [selectedStudentId]);

  const fetchAutoFee = async (studentId: string) => {
    setIsFetchingFee(true);
    try {
      const response = await axios.get(
        getBackendUrl(`/api/fees/student/${studentId}`),
      );
      if (response.data?.total_fee !== undefined) {
        setTotalFee(response.data.total_fee);
      }
    } catch (err) {
      console.error("Auto fee lookup failed", err);
    } finally {
      setIsFetchingFee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    if (!selectedStudentId || totalFee === "" || !deadline) {
      setError("Please fill all required fields!");
      setSubmitLoading(false);
      return;
    }

    try {
      await axios.post(getBackendUrl("/api/fees"), {
        student_id: Number(selectedStudentId),
        total_fee: Number(totalFee),
        paid: paidAmount === "" ? 0 : Number(paidAmount),
        deadline,
      });

      router.push("/fees");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save fee details.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8b5cf6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-poppins">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-xl glass-card p-8 md:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight font-outfit text-white mb-8 heading-underline">
            💰 Add Fee Details
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                Select Student
              </label>
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    -- Select Student --
                  </option>
                  {students.map((s, index) => (
                    <option key={s.id} value={s.id}>
                      {index + 1} - {s.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#b39ddb]">
                  ▼
                </div>
              </div>
            </div>

            {/* Total Fee */}
            <div>
              <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                Total Fee (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalFee}
                  onChange={(e) =>
                    setTotalFee(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter Total Fee"
                  required
                />
                {isFetchingFee && (
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-[#3b82f6] animate-pulse">
                    Matching...
                  </span>
                )}
              </div>
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                Paid Amount (₹)
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                required
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex gap-4 mt-8">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 py-3.5 btn-glow-success text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
              >
                {submitLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Fee
              </button>

              <button
                type="button"
                onClick={() => router.push("/fees")}
                className="flex-1 py-3.5 border border-white/10 hover:bg-[#2a2a40] text-[#e2d8fa] rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
