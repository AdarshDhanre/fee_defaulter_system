"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
} from "lucide-react";

interface FeeAllocation {
  id: number;
  studentId: number;
  studentName: string;
  studentRollNo: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  lateFine: number;
  totalDue: number;
  deadline: string;
  status: string;
}

interface Student {
  id: number;
  name: string;
  rollNo: string;
  branch: string;
  category: string;
}

interface FeeStructure {
  id: number;
  course: string;
  year: string;
  branch: string;
  feeOpen: number;
  feeObc: number;
  feeScst: number;
  feeOms: number;
  feeMgmt: number;
}

export default function FeeManagement() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<FeeAllocation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [activeTab, setActiveTab] = useState<"allocations" | "structures">(
    "allocations",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [totalFee, setTotalFee] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [deadline, setDeadline] = useState("");
  const [isFetchingFee, setIsFetchingFee] = useState(false);

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
      const [allocationsRes, studentsRes, structuresRes] = await Promise.all([
        axios.get(getBackendUrl("/api/fees")),
        axios.get(getBackendUrl("/api/students")),
        axios.get(getBackendUrl("/api/fees/structures")),
      ]);
      setAllocations(allocationsRes.data);
      setStudents(studentsRes.data);
      setStructures(structuresRes.data);
    } catch (err) {
      setError("Failed to load fee data.");
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

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStudentId || totalFee === "" || !deadline) {
      setError("Please fill all required fields!");
      return;
    }

    try {
      await axios.post(getBackendUrl("/api/fees"), {
        student_id: Number(selectedStudentId),
        total_fee: Number(totalFee),
        paid: Number(paidAmount),
        deadline,
      });

      setIsOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to allocate fee.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this fee record?")) {
      return;
    }

    try {
      await axios.delete(getBackendUrl(`/api/fees/${id}`));
      fetchData();
    } catch (err) {
      alert("Failed to delete fee record.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-poppins">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white heading-underline">
              Fee Administration
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage academic fee structure allocations & schedules
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="btn-glow-primary hover:brightness-110 text-white py-3 px-6 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Allocate Student Fee
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mb-8 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("allocations")}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === "allocations"
                ? "border-[#8b5cf6] text-[#8b5cf6] font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Fee Allocations ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab("structures")}
            className={`pb-4 border-b-2 transition-all ${
              activeTab === "structures"
                ? "border-[#8b5cf6] text-[#8b5cf6] font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Course Fee Structures ({structures.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8b5cf6] mx-auto"></div>
          </div>
        ) : activeTab === "allocations" ? (
          /* ALLOCATIONS TAB */
          <section className="glass-card p-6">
            {allocations.length > 0 ? (
              <div className="overflow-hidden">
                <table className="glass-table w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                      <th className="p-4">Student</th>
                      <th className="p-4">Total Fee</th>
                      <th className="p-4">Paid</th>
                      <th className="p-4">Due Amount</th>
                      <th className="p-4">Late Fine</th>
                      <th className="p-4">Total Due</th>
                      <th className="p-4">Deadline</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allocations.map((alloc) => (
                      <tr key={alloc.id} className="text-sm">
                        <td className="p-4">
                          <div className="font-bold text-slate-100">
                            {alloc.studentName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {alloc.studentRollNo}
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">
                          ₹{alloc.totalFee?.toLocaleString()}
                        </td>
                        <td className="p-4 text-[#38ef7d] font-semibold">
                          ₹{alloc.paidAmount?.toLocaleString()}
                        </td>
                        <td className="p-4 text-amber-500 font-semibold">
                          ₹{alloc.dueAmount?.toLocaleString()}
                        </td>
                        <td className="p-4 text-rose-500 font-semibold">
                          ₹{alloc.lateFine?.toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-slate-200">
                          ₹{alloc.totalDue?.toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-xs">
                          {alloc.deadline
                            ? new Date(alloc.deadline).toLocaleDateString(
                                "en-GB",
                              )
                            : "N/A"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              alloc.status === "Paid"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : alloc.status === "Overdue"
                                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse"
                                  : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            }`}
                          >
                            {alloc.status === "Paid" && (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {alloc.status === "Overdue" && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {alloc.status === "Partial" && (
                              <HelpCircle className="w-3 h-3" />
                            )}
                            {alloc.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(alloc.id)}
                            className="p-2.5 bg-rose-950/20 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-rose-400 hover:text-white transition-all shadow-[0_4px_10px_rgba(244,63,94,0.15)]"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">
                No fee allocations configured yet.
              </div>
            )}
          </section>
        ) : (
          /* STRUCTURES TAB */
          <section className="glass-card p-6">
            {structures.length > 0 ? (
              <div className="overflow-hidden">
                <table className="glass-table w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                      <th className="p-4">Course & Year</th>
                      <th className="p-4">Branch Abbreviations</th>
                      <th className="p-4">Open Fee</th>
                      <th className="p-4">OBC Fee</th>
                      <th className="p-4">SC/ST Fee</th>
                      <th className="p-4">OMS Fee</th>
                      <th className="p-4">Mgmt. Quota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {structures.map((struct) => (
                      <tr key={struct.id}>
                        <td className="p-4 font-bold text-slate-100">
                          {struct.course}
                          <div className="text-xs text-slate-500 font-semibold mt-0.5">
                            {struct.year}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-[#b39ddb] font-mono text-xs">
                          {struct.branch}
                        </td>
                        <td className="p-4">
                          ₹{struct.feeOpen?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          ₹{struct.feeObc?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          ₹{struct.feeScst?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          ₹{struct.feeOms?.toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-[#3b82f6]">
                          ₹{struct.feeMgmt?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">
                No fee structures configured in the database.
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal - Allocate Fee Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e2f]/95 border border-white/10 rounded-[15px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#2a2a40]/30">
              <h3 className="font-outfit font-bold text-lg text-white">
                Allocate Student Fee
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="p-6 space-y-4">
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
                      {s.name} ({s.rollNo} - {s.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Total Academic Fee (₹)
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
                    className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                    placeholder={
                      isFetchingFee
                        ? "Matching structures..."
                        : "Enter total fee amount"
                    }
                    required
                  />
                  {isFetchingFee && (
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-[#3b82f6] animate-pulse">
                      Matching...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Pre-paid / Current Paid Amount (₹)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                  placeholder="Defaults to 0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Payment Deadline
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
                  Allocate Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
