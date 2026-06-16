"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Chart, registerables } from "chart.js";
import { Check, X, FileText, Sparkles, Users, CheckCircle2, PieChart, OctagonAlert, Clock, Calendar, Zap } from "lucide-react";

if (typeof window !== "undefined") {
  Chart.register(...registerables);
}

interface Receipt {
  id: number;
  filePath: string;
  extractedUtr: string;
  extractedAmount: number;
  extractedDate: string;
  aiConfidence: string;
  status: string;
  uploadDate: string;
  studentName: string;
  studentRollNo: string;
  studentEmail: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  const doughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutInstance = useRef<Chart | null>(null);
  const barInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Set Current Date in local format like the old template
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("en-US", dateOptions));

    // Check auth
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchStats();
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(getBackendUrl("/api/dashboard"));
      setStats(response.data);
    } catch (err) {
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (
    receiptId: number,
    action: "approve" | "reject",
  ) => {
    setVerifyingId(receiptId);
    try {
      await axios.post(getBackendUrl("/api/dashboard/verify-receipt"), {
        receipt_id: receiptId,
        action,
      });
      // Refresh statistics & receipts list
      await fetchStats();
    } catch (err) {
      alert("Verification failed. Please try again.");
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    if (!stats) return;

    // ==========================================
    // 1. DOUGHNUT CHART (Fee Collection Status)
    // ==========================================
    if (doughnutChartRef.current) {
      if (doughnutInstance.current) {
        doughnutInstance.current.destroy();
      }
      const ctx = doughnutChartRef.current.getContext("2d");
      if (ctx) {
        const gradientPaid = ctx.createLinearGradient(0, 0, 0, 400);
        gradientPaid.addColorStop(0, "#10b981");
        gradientPaid.addColorStop(1, "#059669");

        const gradientPartial = ctx.createLinearGradient(0, 0, 0, 400);
        gradientPartial.addColorStop(0, "#f59e0b");
        gradientPartial.addColorStop(1, "#d97706");

        const gradientOverdue = ctx.createLinearGradient(0, 0, 0, 400);
        gradientOverdue.addColorStop(0, "#ef4444");
        gradientOverdue.addColorStop(1, "#b91c1c");

        const paidCount = stats.paidCount || 0;
        const partialCount = stats.partialCount || 0;
        const overdueCount = stats.overdueCount || 0;
        const hasData = paidCount + partialCount + overdueCount > 0;

        doughnutInstance.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: hasData
              ? ["Fully Paid", "Partial Payment", "Overdue"]
              : ["No Data Available"],
            datasets: [
              {
                data: hasData ? [paidCount, partialCount, overdueCount] : [1],
                backgroundColor: hasData
                  ? [gradientPaid, gradientPartial, gradientOverdue]
                  : ["rgba(255, 255, 255, 0.1)"],
                borderWidth: 0,
                hoverOffset: hasData ? 10 : 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
              legend: {
                position: "right",
                labels: {
                  color: "#cbd5e1",
                  font: {
                    family: "'Outfit', sans-serif",
                    size: 13,
                    weight: 500,
                  },
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: "circle",
                },
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                titleFont: { size: 14, family: "'Outfit', sans-serif" },
                bodyFont: { size: 14, family: "'Outfit', sans-serif" },
                padding: 15,
                cornerRadius: 10,
                displayColors: true,
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
              },
            },
          },
        });
      }
    }

    // ==========================================
    // 2. BAR CHART (Branch-wise Revenue)
    // ==========================================
    if (barChartRef.current) {
      if (barInstance.current) {
        barInstance.current.destroy();
      }
      const ctx = barChartRef.current.getContext("2d");
      if (ctx) {
        const barGradient = ctx.createLinearGradient(0, 0, 0, 400);
        barGradient.addColorStop(0, "#8b5cf6");
        barGradient.addColorStop(1, "#6d28d9");

        barInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: stats.branchLabels || [],
            datasets: [
              {
                label: "Total Revenue Collected (₹)",
                data: stats.branchRevenue || [],
                backgroundColor: barGradient,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 40,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                titleFont: { size: 14, family: "'Outfit', sans-serif" },
                bodyFont: { size: 14, family: "'Outfit', sans-serif" },
                padding: 15,
                cornerRadius: 10,
                callbacks: {
                  label: function (context: any) {
                    return " ₹ " + context.parsed.y.toLocaleString();
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                border: {
                  display: false,
                },
                grid: {
                  color: "rgba(255, 255, 255, 0.05)",
                },
                ticks: {
                  color: "#94a3b8",
                  font: { family: "'Outfit', sans-serif" },
                  callback: function (value: any) {
                    if (value >= 100000)
                      return "₹" + (value / 100000).toFixed(1) + "L";
                    if (value >= 1000)
                      return "₹" + (value / 1000).toFixed(1) + "k";
                    return "₹" + value;
                  },
                },
              },
              x: {
                border: {
                  display: false,
                },
                grid: {
                  display: false,
                },
                ticks: {
                  color: "#94a3b8",
                  font: {
                    family: "'Outfit', sans-serif",
                    size: 13,
                    weight: 600,
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (doughnutInstance.current) {
        doughnutInstance.current.destroy();
      }
      if (barInstance.current) {
        barInstance.current.destroy();
      }
    };
  }, [stats]);

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

      {/* Injecting original styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Metric Cards */
        .metric-card {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.2rem;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1.2rem;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .metric-card:hover {
            transform: translateY(-5px);
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .metric-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.8rem;
        }

        .metric-info {
            display: flex;
            flex-direction: column;
        }

        .metric-title {
            color: #94a3b8;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            color: #ffffff;
            font-size: 1.8rem;
            font-weight: 800;
            margin: 0;
        }

        /* Dashboard Panels */
        .dashboard-panel {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .panel-title {
            color: #f8fafc;
            font-weight: 700;
        }

        .status-ring {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(139, 92, 246, 0.1);
            border: 2px solid rgba(139, 92, 246, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
        }

        /* Responsive Columns */
        .dashboard-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
        }
      `,
        }}
      />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-white m-0">
            Dashboard Overview
          </h2>
          <div
            className="text-slate-400 flex items-center gap-1.5"
            style={{ fontSize: "0.9rem" }}
          >
            <Calendar className="w-4 h-4" /> Today:{" "}
            <span id="currentDate">{currentDate}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* 🔥 METRICS CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Students */}
          <div className="metric-card">
            <div
              className="metric-icon"
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                color: "#3b82f6",
                boxShadow: "0 0 15px rgba(59,130,246,0.3)",
              }}
            >
              <Users className="w-6 h-6" />
            </div>
            <div className="metric-info">
              <p className="metric-title">Total Students</p>
              <h3 className="metric-value">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          {/* Paid */}
          <div className="metric-card">
            <div
              className="metric-icon"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                boxShadow: "0 0 15px rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="metric-info">
              <p className="metric-title">Fully Paid</p>
              <h3 className="metric-value">{stats?.paidCount || 0}</h3>
            </div>
          </div>

          {/* Partial */}
          <div className="metric-card">
            <div
              className="metric-icon"
              style={{
                background: "rgba(245, 158, 11, 0.2)",
                color: "#f59e0b",
                boxShadow: "0 0 15px rgba(245,158,11,0.3)",
              }}
            >
              <PieChart className="w-6 h-6" />
            </div>
            <div className="metric-info">
              <p className="metric-title">Partial</p>
              <h3 className="metric-value">{stats?.partialCount || 0}</h3>
            </div>
          </div>

          {/* Overdue */}
          <div className="metric-card">
            <div
              className="metric-icon"
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                boxShadow: "0 0 15px rgba(239,68,68,0.3)",
              }}
            >
              <OctagonAlert className="w-6 h-6" />
            </div>
            <div className="metric-info">
              <p className="metric-title">Overdue</p>
              <h3 className="metric-value">{stats?.overdueCount || 0}</h3>
            </div>
          </div>

          {/* Total Fine */}
          <div
            className="metric-card"
            style={{ border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <div
              className="metric-icon"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
            >
              <Clock className="w-6 h-6" />
            </div>
            <div className="metric-info">
              <p className="metric-title">Pending Fine</p>
              <h3 className="metric-value">
                ₹{stats?.totalFinePending?.toLocaleString() || 0}
              </h3>
            </div>
          </div>
        </section>

        {/* 🔥 CHART & SUMMARY ROW */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="dashboard-panel">
              <h5 className="panel-title mb-4 text-base">
                Fee Collection Status
              </h5>
              <div className="relative h-[300px] w-full flex justify-center">
                <canvas ref={doughnutChartRef}></canvas>
              </div>
            </div>
          </div>

          <div>
            <div className="dashboard-panel flex flex-col justify-center items-center text-center h-full min-h-[300px]">
              <div className="status-ring mb-4">
                <Zap className="w-9 h-9 text-[#8b5cf6]" />
              </div>
              <h4 className="text-white text-lg font-bold mb-2">
                Quick Actions
              </h4>
              <p className="text-slate-400 text-xs mb-6 max-w-[240px]">
                Send payment reminders to overdue students instantly.
              </p>
              <Link
                href="/defaulters"
                className="w-full bg-[#8b5cf6] hover:bg-[#7c4dff] text-white font-bold py-3 rounded-xl transition-all shadow-[0_5px_15px_rgba(139,92,246,0.3)] mb-3 text-sm flex items-center justify-center"
              >
                View Defaulters
              </Link>
              <Link
                href="/payments"
                className="w-full border border-white/20 hover:bg-white/5 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center"
              >
                Log New Payment
              </Link>
            </div>
          </div>
        </section>

        {/* 🔥 SECOND ROW: BAR CHART */}
        <section className="mb-8">
          <div className="dashboard-panel">
            <h5 className="panel-title mb-4 text-base">
              Branch-wise Revenue 💰
            </h5>
            <div className="relative h-[350px] w-full">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>
        </section>

        {/* 🔥 THIRD ROW: AI OCR VERIFICATION */}
        {stats?.pendingReceipts?.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <div
              className="dashboard-panel"
              style={{ border: "1px solid #8b5cf6" }}
            >
              <div className="flex justify-between items-center mb-6">
                <h5 className="panel-title m-0 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                  AI Receipt Verification
                </h5>
                <span className="badge bg-danger text-xs font-bold text-white bg-red-600 px-3 py-1 rounded-full">
                  {stats.pendingReceipts.length} Pending
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="glass-table w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider bg-slate-900">
                      <th className="p-4">Student</th>
                      <th className="p-4">AI Extracted UTR</th>
                      <th className="p-4">AI Amount</th>
                      <th className="p-4">Confidence</th>
                      <th className="p-4">Receipt Photo</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.pendingReceipts.map((receipt: Receipt) => (
                      <tr
                        key={receipt.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 font-semibold text-slate-200">
                          {receipt.studentName || `ID: ${receipt.id}`}
                        </td>
                        <td className="p-4 text-cyan-400 font-mono font-bold">
                          {receipt.extractedUtr || "N/A"}
                        </td>
                        <td className="p-4 text-emerald-400 font-bold">
                          ₹{receipt.extractedAmount?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              receipt.aiConfidence === "High"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            }`}
                          >
                            {receipt.aiConfidence}
                          </span>
                        </td>
                        <td className="p-4">
                          <a
                            href={getBackendUrl(`${receipt.filePath}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold text-xs border border-cyan-400/20 bg-cyan-400/10 py-1.5 px-3 rounded-lg w-max transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Image
                          </a>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={verifyingId !== null}
                              onClick={() =>
                                handleVerify(receipt.id, "approve")
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              disabled={verifyingId !== null}
                              onClick={() => handleVerify(receipt.id, "reject")}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
