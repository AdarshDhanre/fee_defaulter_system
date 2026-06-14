"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Download, Plus, Receipt, User, ArrowUpRight, X } from "lucide-react";

interface PaymentLog {
  id: number;
  studentId: number;
  studentName: string;
  studentRollNo: string;
  amount: number;
  date: string;
  method: string;
  transactionId: string;
}

interface Student {
  id: number;
  name: string;
  rollNo: string;
  branch: string;
}

export default function PaymentLogs() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState<number | "">("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        axios.get(getBackendUrl("/api/payments/history")),
        axios.get(getBackendUrl("/api/students")),
      ]);
      setPayments(paymentsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError("Failed to fetch payment history logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Navigate browser to download CSV endpoint
    window.open(getBackendUrl("/api/payments/export-csv"), "_blank");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId || amount === "") {
      setError("Please fill all required fields!");
      return;
    }

    try {
      await axios.post(getBackendUrl("/api/payments/pay"), {
        student_id: Number(selectedStudentId),
        amount: Number(amount),
      });

      setIsOpen(false);
      fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to record payment details.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-poppins">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white heading-underline">
              Payment Ledger
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Audit transactions, log receipts, and export CSV reports
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              className="bg-[#2a2a40] hover:bg-[#32324e] border border-white/10 text-[#e2d8fa] py-3 px-6 rounded-full font-semibold flex items-center gap-2 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV Report
            </button>
            <button
              onClick={() => {
                setSelectedStudentId("");
                setAmount("");
                setIsOpen(true);
              }}
              className="btn-glow-primary hover:brightness-110 text-white py-3 px-6 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Log Manual Payment
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Ledger logs table */}
        <section className="glass-card p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8b5cf6] mx-auto"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-hidden">
              <table className="glass-table w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                    <th className="p-4">Receipt ID</th>
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Transaction UTR / Ref</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        #{pay.id}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100">
                          {pay.studentName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {pay.studentRollNo}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#38ef7d]">
                        ₹{pay.amount?.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300 tracking-wide">
                        {pay.transactionId}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {pay.date
                          ? new Date(pay.date).toLocaleString("en-GB")
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            pay.method === "Razorpay"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : pay.method === "Offline Challan"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          {pay.method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No transactions recorded in the ledger.
            </div>
          )}
        </section>
      </main>

      {/* Modal - Log Manual Payment Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e2f]/95 border border-white/10 rounded-[15px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#2a2a40]/30">
              <h3 className="font-outfit font-bold text-lg text-white">
                Log Manual Payment
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                  placeholder="Enter fee amount collected"
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 border border-white/10 hover:bg-[#2a2a40] rounded-full font-semibold text-sm transition-all text-[#e2d8fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 btn-glow-primary text-white rounded-full font-bold text-sm transition-all"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
