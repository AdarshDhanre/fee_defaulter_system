"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Shield, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function StudentInvoiceReceipt() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/student-portal/receipt/${id}`,
      );
      setReceipt(response.data);
    } catch (err) {
      setError("Failed to fetch receipt invoice details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400 font-medium">
          {error || "Receipt not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 print:bg-white print:text-black">
      {/* Header controls (Hidden on Print) */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </button>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/10 text-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      {/* Invoice Card */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden print:border-0 print:bg-white print:shadow-none print:p-0">
        {/* Background gradient (Hidden on Print) */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl print:hidden"></div>

        {/* Brand details */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-6 mb-8 print:border-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl print:border-0">
              <Shield className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-wide uppercase">
                EduPortal College
              </h2>
              <span className="text-xs text-slate-500 uppercase font-semibold">
                Official E-Receipt
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full print:border-0 print:text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              Verified Pay
            </span>
            <div className="text-[10px] font-mono text-slate-500 mt-2">
              TXN ID: {receipt.transactionId}
            </div>
          </div>
        </div>

        {/* Invoice Grid Info */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8 text-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">
              Receipt Issued To
            </span>
            <div className="font-bold text-slate-100 print:text-black">
              {receipt.studentName}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Roll No: {receipt.studentRollNo}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">
              Course & Department
            </span>
            <div className="font-bold text-slate-100 print:text-black">
              {receipt.studentCourse}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {receipt.studentBranch}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">
              Receipt ID
            </span>
            <div className="font-bold text-slate-200 font-mono">
              #{receipt.paymentId}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">
              Transaction Date
            </span>
            <div className="font-bold text-slate-200 font-mono">
              {receipt.date
                ? new Date(receipt.date).toLocaleString("en-GB")
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 mb-8 print:border-black print:bg-white">
          <div className="flex justify-between items-center py-2 text-sm">
            <span className="text-slate-400 font-semibold">
              Total Course Fee Allocated
            </span>
            <span className="font-bold text-slate-200 print:text-black">
              ₹{receipt.totalFee?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 text-sm border-b border-slate-800 print:border-black pb-4">
            <span className="text-slate-400 font-semibold">
              Payment Channel / Method
            </span>
            <span className="font-semibold text-slate-300 print:text-black">
              {receipt.method}
            </span>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">
              Amount Received
            </span>
            <span className="text-xl font-black text-emerald-400 print:text-emerald-600">
              ₹{receipt.amount?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Remaining dues warning */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Remaining Dues Outstanding:</span>
          <span className="font-bold font-mono text-slate-400 print:text-black">
            ₹{receipt.dueAmount?.toLocaleString()}
          </span>
        </div>

        {/* Invoice Footer note */}
        <div className="text-center text-[10px] text-slate-600 mt-12 border-t border-slate-800 pt-4 print:border-black">
          This document is a digitally generated computer certificate validation
          copy and does not require a physical signature.
        </div>
      </div>
    </div>
  );
}
