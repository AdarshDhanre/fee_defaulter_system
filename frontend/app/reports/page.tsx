"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3,
  Download,
  Bell,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";

interface FeeRecord {
  id: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  deadline: string;
  lateFine: number;
  totalDue: number;
  status: string;
  studentId: number;
  studentName: string;
  studentRollNo: string;
  studentEmail: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "info" | null
  >(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const [statsRes, feesRes] = await Promise.all([
        axios.get(getBackendUrl("/api/dashboard")),
        axios.get(getBackendUrl("/api/fees")),
      ]);
      setStats(statsRes.data);
      setFees(feesRes.data);
    } catch (err) {
      setError("Failed to fetch reports and statistics data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    // Navigate directly to the download endpoint to trigger browser file download
    window.open(getBackendUrl("/api/payments/export-csv"), "_blank");
  };

  const handleSendOverdueAlerts = async () => {
    setActionLoading(true);
    setAlertMessage(null);
    try {
      const response = await axios.post(
        getBackendUrl("/api/payments/alerts/overdue"),
      );
      setAlertMessage(response.data.message || "Alerts sent successfully!");
      setAlertType("success");
    } catch (err: any) {
      setAlertMessage(
        err.response?.data?.message || "Failed to send overdue alerts.",
      );
      setAlertType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPartialAlerts = async () => {
    setActionLoading(true);
    setAlertMessage(null);
    try {
      const response = await axios.post(
        getBackendUrl("/api/payments/alerts/partial"),
      );
      setAlertMessage(
        response.data.message || "Partial alerts sent successfully!",
      );
      setAlertType("success");
    } catch (err: any) {
      setAlertMessage(
        err.response?.data?.message || "Failed to send partial alerts.",
      );
      setAlertType("error");
    } finally {
      setActionLoading(false);
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

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white heading-underline">
              Reports Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Export spreadsheets & notify fee defaulters
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Status notification popups */}
        {alertMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e1e2f]/95 border border-white/10 rounded-[15px] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-6 text-center">
              <div className="text-5xl mb-4">
                {alertType === "success"
                  ? "✅"
                  : alertType === "error"
                    ? "❌"
                    : "ℹ️"}
              </div>
              <h3 className="font-outfit font-bold text-lg text-white mb-3">
                Alert Status
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {alertMessage
                  .replace("✅", "")
                  .replace("❌", "")
                  .replace("📧", "")
                  .replace("SUCCESS:", "")}
              </p>
              <button
                onClick={() => setAlertMessage(null)}
                className="btn-glow-primary text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-md transform active:scale-95 transition-all w-full"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

        {actionLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none">
            <div className="bg-[#1e1e2f]/90 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#eab308]"></div>
              <span className="text-[#eab308] text-xs font-bold uppercase tracking-wider animate-pulse">
                Sending automated email alerts...
              </span>
            </div>
          </div>
        )}

        {/* Summary counts from reports.html */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="p-4 bg-[#3b82f6]/10 rounded-2xl border border-[#3b82f6]/20 text-[#3b82f6] shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total Students
              </span>
              <span className="text-2xl font-bold font-outfit">
                {stats?.totalStudents || 0}
              </span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="p-4 bg-[#38ef7d]/10 rounded-2xl border border-[#38ef7d]/20 text-[#38ef7d] shadow-[inset_0_0_10px_rgba(56,239,125,0.1)]">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Fully Paid
              </span>
              <span className="text-2xl font-bold font-outfit">
                {stats?.paidCount || 0}
              </span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Partial Dues
              </span>
              <span className="text-2xl font-bold font-outfit">
                {stats?.partialCount || 0}
              </span>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-5">
            <div className="p-4 bg-[#ff0844]/10 rounded-2xl border border-[#ff0844]/20 text-[#ff0844] shadow-[inset_0_0_10px_rgba(255,8,68,0.1)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Overdue Defaulters
              </span>
              <span className="text-2xl font-bold font-outfit text-white">
                {stats?.overdueCount || 0}
              </span>
            </div>
          </div>
        </section>

        {/* Action Buttons Panel */}
        <section className="bg-[#1e1e2f]/50 border border-white/10 p-6 rounded-[20px] shadow-xl flex flex-wrap gap-4 mb-8 items-center">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Download CSV Report
          </button>

          <button
            onClick={handleSendOverdueAlerts}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:brightness-110 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all text-sm danger-pulse"
          >
            <Bell className="w-4 h-4" />
            Send Alerts to Defaulters
          </button>

          <button
            onClick={handleSendPartialAlerts}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-white rounded-full font-bold shadow-lg transform active:scale-95 transition-all text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Send Partial Fee Alerts
          </button>
        </section>

        {/* Full Report Table */}
        <section className="glass-card p-6">
          <h3 className="font-outfit font-bold text-lg mb-6 text-white heading-underline flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#eab308]" />
            Full Defaulters Report Ledger
          </h3>

          {fees.length > 0 ? (
            <div className="overflow-hidden">
              <table className="glass-table w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Total Allocated</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Outstanding Due</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fees.map((record) => (
                    <tr key={record.id} className="text-sm">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">
                          {record.studentName || "N/A"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {record.studentRollNo || "N/A"} •{" "}
                          {record.studentEmail || "N/A"}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        ₹{record.totalFee?.toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-[#38ef7d]">
                        ₹{record.paidAmount?.toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-rose-400">
                        ₹{record.totalDue?.toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-mono">
                        {record.deadline
                          ? new Date(record.deadline).toLocaleDateString(
                              "en-GB",
                            )
                          : "N/A"}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            record.status === "Paid"
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              : record.status === "Partial"
                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No fee logs found in the system.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
