"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  AlertOctagon,
  Send,
  Mail,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface Defaulter {
  studentId: number;
  name: string;
  total_fee: number;
  paid: number;
  due: number;
  status: string;
  deadline: string;
}

export default function DefaultersList() {
  const router = useRouter();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchDefaulters();
    }
  }, [router]);

  const fetchDefaulters = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(getBackendUrl("/api/fees"));
      // Filter list of students who have outstanding due balances and are overdue or have unpaid fees
      const allocations = response.data;
      const overdueDefaulters = allocations
        .filter(
          (a: any) =>
            a.dueAmount > 0 && (a.status === "Overdue" || a.paidAmount === 0),
        )
        .map((a: any) => ({
          studentId: a.studentId,
          name: a.studentName,
          total_fee: a.totalFee,
          paid: a.paidAmount,
          due: a.dueAmount,
          status: a.status,
          deadline: a.deadline,
        }));
      setDefaulters(overdueDefaulters);
    } catch (err: any) {
      console.error("Error fetching defaulters:", err);
      setError(
        "Failed to load defaulters database: " +
          (err.response?.data?.message || err.message || err),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOverdueAlerts = async () => {
    setActionMessage("");
    setTriggering(true);
    try {
      const response = await axios.post(
        getBackendUrl("/api/payments/alerts/overdue"),
      );
      setActionMessage(
        response.data.message || "Overdue alert emails triggered successfully!",
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to trigger overdue email alerts.",
      );
    } finally {
      setTriggering(false);
    }
  };

  const handleSendPartialAlerts = async () => {
    setActionMessage("");
    setTriggering(true);
    try {
      const response = await axios.post(
        getBackendUrl("/api/payments/alerts/partial"),
      );
      setActionMessage(
        response.data.message ||
          "Reminder emails triggered for partial fee payers.",
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to trigger partial email alerts.",
      );
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-poppins">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white heading-underline flex items-center gap-2.5">
              <AlertOctagon className="w-8 h-8 text-rose-500 animate-pulse" />
              Overdue Defaulters
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Audit outstanding dues and trigger automated email warnings
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSendPartialAlerts}
              disabled={triggering}
              className="bg-[#2a2a40] hover:bg-[#32324e] border border-white/10 text-[#e2d8fa] py-3 px-6 rounded-full font-semibold flex items-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-400" />
              Alert Partial Payers
            </button>
            <button
              onClick={handleSendOverdueAlerts}
              disabled={triggering}
              className="btn-glow-danger hover:brightness-110 text-white py-3 px-6 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-all text-sm disabled:opacity-50 danger-pulse"
            >
              <Mail className="w-4 h-4 text-white" />
              Alert All Overdue
            </button>
          </div>
        </header>

        {actionMessage && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2.5 text-sm font-semibold shadow-[0_4px_15px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {actionMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Defaulter table list */}
        <section className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-outfit font-bold text-lg text-white">
              Defaulters Directory ({defaulters.length})
            </h3>
            <button
              onClick={fetchDefaulters}
              className="p-2.5 bg-[#2a2a40] border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
              title="Refresh Directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8b5cf6] mx-auto"></div>
            </div>
          ) : defaulters.length > 0 ? (
            <div className="overflow-hidden">
              <table className="glass-table w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                    <th className="p-4">Sr. No.</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Total Academic Fee</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Outstanding Balance</th>
                    <th className="p-4">Deadline Passed</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {defaulters.map((def, idx) => (
                    <tr key={`${def.studentId}-${idx}`}>
                      <td className="p-4 font-semibold text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="p-4 font-bold text-slate-100">
                        {def.name}
                      </td>
                      <td className="p-4 text-slate-400 font-semibold font-mono text-xs">
                        ₹{def.total_fee?.toLocaleString()}
                      </td>
                      <td className="p-4 text-[#38ef7d] font-mono text-xs">
                        ₹{def.paid?.toLocaleString()}
                      </td>
                      <td className="p-4 text-[#ff0844] font-bold font-mono text-xs">
                        ₹{def.due?.toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        {def.deadline
                          ? new Date(def.deadline).toLocaleDateString("en-GB")
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            def.status === "Overdue"
                              ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse"
                              : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                          }`}
                        >
                          {def.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">All Clear!</p>
              <p className="text-xs text-slate-500 mt-1">No defaulters found. All students are on track.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
