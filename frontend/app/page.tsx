"use client";
import { getBackendUrl } from "@/utils/api";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import axios from "axios";
import {
  GraduationCap,
  User,
  CreditCard,
  Upload,
  History,
  FileText,
  LogOut,
  Wallet,
  CheckCircle,
  Clock,
  Send,
  X,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface PaymentLog {
  id: number;
  amount: number;
  date: string;
  method: string;
  transactionId: string;
}

interface OfflineReceipt {
  id: number;
  filePath: string;
  extractedUtr: string;
  extractedAmount: number;
  extractedDate: string;
  aiConfidence: string;
  status: string;
  uploadDate: string;
}

interface Message {
  sender: "user" | "bot";
  text: string;
  id?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "pay" | "upload" | "requests" | "receipts"
  >("overview");

  // Razorpay states
  const [payAmount, setPayAmount] = useState<string>("");
  const [payLoading, setPayLoading] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [ocrData, setOcrData] = useState<any>(null);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: 'Hi! 👋 I am your AI Assistant. You can ask me things like: "What is my pending fee?"',
    },
  ]);
  const [userQuery, setUserQuery] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");

    if (role !== "STUDENT" || !id) {
      router.push("/login");
    } else {
      setStudentId(id);
      setStudentName(name || "Student");
      fetchStudentDashboard(id);
    }
  }, [router]);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const fetchStudentDashboard = async (id: string) => {
    try {
      const response = await axios.get(
        getBackendUrl(`/api/student-portal/dashboard/${id}`),
      );
      setStudentData(response.data);
      if (response.data.totalPayable) {
        setPayAmount(response.data.totalPayable.toString());
      }
    } catch (err) {
      setError("Failed to load student portal dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // 💳 RAZORPAY PAYMENT PROCESS
  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setPayLoading(true);
    setError("");

    try {
      // 1. Create order on Spring Boot backend
      const orderRes = await axios.post(
        getBackendUrl("/api/student-portal/create-order"),
        {
          student_id: Number(studentId),
          amount: Number(payAmount),
        },
      );

      const options = {
        key: studentData.razorpayKeyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "EduPortal Fee System",
        description: "Fee Payment",
        image: "https://cdn-icons-png.flaticon.com/512/3225/3225068.png",
        order_id: orderRes.data.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await axios.post(
              getBackendUrl("/api/student-portal/verify-payment"),
              {
                student_id: Number(studentId),
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount_paid: Number(payAmount),
              },
            );

            if (verifyRes.data.success) {
              alert("Payment Successful! E-Receipt generated.");
              setPayAmount("");
              fetchStudentDashboard(studentId);
              setActiveTab("receipts");
            }
          } catch (err) {
            alert("Verification Failed. Please contact accounts department.");
          }
        },
        prefill: {
          name: orderRes.data.name,
          email: orderRes.data.email,
          contact: orderRes.data.contact,
        },
        theme: {
          color: "#4318FF",
        },
        modal: {
          ondismiss: function () {
            setPayLoading(false);
          },
        },
      };

      // Open Razorpay Popup
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Payment initialisation failed. Try again.",
      );
    } finally {
      setPayLoading(false);
    }
  };

  // 📤 OFFLINE RECEIPT UPLOAD PROCESS
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError("");
      setUploadSuccess("");
      setOcrData(null);

      // Trigger upload automatically like the old UI
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploadProgress("AI is Scanning your Receipt...");
    const formData = new FormData();
    formData.append("student_id", studentId);
    formData.append("receipt", file);

    try {
      const response = await axios.post(
        getBackendUrl("/api/student-portal/upload-receipt"),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const extracted = response.data.data;
      setOcrData({
        utr: extracted.transaction_id || "Not Found",
        amount: extracted.amount || "Not Found",
        date: extracted.date || "Not Found",
      });
      setUploadSuccess("Receipt Scanned Successfully!");
      fetchStudentDashboard(studentId);
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error || "Upload failed. Please try again.",
      );
      setSelectedFile(null);
    } finally {
      setUploadProgress("");
    }
  };

  // 🤖 GEMINI CHAT BOT PROCESS
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const userText = userQuery.trim();
    setUserQuery("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setBotLoading(true);

    // Add temp typing indicator
    const typingId = "typing-" + Date.now();
    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: "...", id: typingId },
    ]);

    try {
      const response = await axios.post(
        getBackendUrl("/api/student-portal/chat"),
        {
          student_id: Number(studentId),
          message: userText,
        },
      );

      setChatMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({ sender: "bot", text: response.data.reply }),
      );
    } catch (err) {
      setChatMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            sender: "bot",
            text: "Sorry, I am unable to connect to the assistant server.",
          }),
      );
    } finally {
      setBotLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4318FF]"></div>
      </div>
    );
  }

  const student = studentData?.student || {};
  const pendingRequestsCount =
    studentData?.offlineReceipts?.filter(
      (r: OfflineReceipt) => r.status === "Pending",
    ).length || 0;

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-[#2B3674] font-outfit flex">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 p-[2.5rem_1.5rem] shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] z-10">
        <div className="font-extrabold text-[1.8rem] text-[#2B3674] flex items-center justify-center gap-3 mb-6">
          <GraduationCap className="w-8 h-8 text-[#4318FF]" />
          Student Portal
        </div>

        {/* Profile Area in Sidebar */}
        <div className="text-center mb-6 pb-6 border-b border-slate-100">
          <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[#868CFF] to-[#4318FF] flex items-center justify-center text-[2.5rem] font-bold text-white mx-auto mb-3 shadow-[0_10px_20px_rgba(67,24,255,0.2)]">
            {student.name ? student.name[0].toUpperCase() : "S"}
          </div>
          <h5 className="font-bold text-[1.1rem] text-[#2B3674] mb-1.5">
            {student.name}
          </h5>
          <span className="inline-block bg-[#F4F7FE] text-[#4318FF] px-3 py-1 text-xs font-bold rounded-lg">
            Roll: {student.rollNo}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow flex flex-col gap-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "overview"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <Wallet className="w-5 h-5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "profile"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <User className="w-5 h-5" />
            My Profile
          </button>

          <button
            onClick={() => setActiveTab("pay")}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "pay"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Pay Online
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "upload"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Challan
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "requests"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <span className="flex items-center gap-4">
              <Clock className="w-5 h-5" />
              My Requests
            </span>
            {pendingRequestsCount > 0 && (
              <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("receipts")}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 ${
              activeTab === "receipts"
                ? "bg-[#F4F7FE] text-[#4318FF] border-[#4318FF]"
                : "border-transparent text-[#A3AED0] hover:bg-[#F4F7FE]/50 hover:text-[#4318FF]"
            }`}
          >
            <FileText className="w-5 h-5" />
            Receipts
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm text-left transition-all border-l-4 border-transparent text-[#A3AED0] hover:bg-red-50 hover:text-red-600 mt-auto"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] p-[3rem_4rem] min-h-screen overflow-y-auto">
        {/* SECTION: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="animate-fade-up">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="font-bold text-[2.2rem] text-[#2B3674] leading-none mb-2">
                  Dashboard 👋
                </h2>
                <p className="text-[#A3AED0] font-semibold text-sm">
                  Course:{" "}
                  <strong className="text-[#2B3674]">{student.course}</strong>{" "}
                  &nbsp;|&nbsp; Branch:{" "}
                  <strong className="text-[#2B3674]">{student.branch}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-7 flex items-center gap-6 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] hover:-translate-y-1 transition-transform">
                <div className="w-[65px] h-[65px] rounded-full bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center text-2xl">
                  <Wallet />
                </div>
                <div>
                  <p className="text-sm text-[#A3AED0] font-semibold mb-0.5">
                    Total Course Fee
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#2B3674]">
                    ₹{studentData?.totalFee?.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-7 flex items-center gap-6 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] hover:-translate-y-1 transition-transform">
                <div className="w-[65px] h-[65px] rounded-full bg-[#E6FAF5] text-[#05CD99] flex items-center justify-center text-2xl">
                  <CheckCircle />
                </div>
                <div>
                  <p className="text-sm text-[#A3AED0] font-semibold mb-0.5">
                    Amount Paid
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#2B3674]">
                    ₹{studentData?.paidFee?.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-7 flex items-center gap-6 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] hover:-translate-y-1 transition-transform">
                <div className="w-[65px] h-[65px] rounded-full bg-[#FFEDEC] text-[#EE5D50] flex items-center justify-center text-2xl">
                  <Clock />
                </div>
                <div>
                  <p className="text-sm text-[#A3AED0] font-semibold mb-0.5">
                    Late Fine (₹50/day)
                  </p>
                  <h3 className="text-3xl font-extrabold text-[#2B3674]">
                    ₹{studentData?.totalFine?.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#4318FF] to-[#868CFF] rounded-3xl p-7 flex items-center gap-6 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.15)] text-white hover:-translate-y-1 transition-transform">
                <div className="w-[65px] h-[65px] rounded-full bg-white/20 text-white flex items-center justify-center text-2xl">
                  <span className="font-extrabold">₹</span>
                </div>
                <div>
                  <p className="text-sm text-white/80 font-semibold mb-0.5">
                    Total Payable Amount
                  </p>
                  <h3 className="text-3xl font-extrabold">
                    ₹{studentData?.totalPayable?.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: MY PROFILE */}
        {activeTab === "profile" && (
          <div className="animate-fade-up">
            <div className="mb-10">
              <h2 className="font-bold text-[2.2rem] text-[#2B3674] mb-2">
                My Profile
              </h2>
              <p className="text-[#A3AED0] font-semibold text-sm">
                View your personal and academic details.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] max-w-[800px]">
              <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
                {/* Avatar Left */}
                <div className="flex flex-col items-center text-center md:border-r border-slate-100 md:pr-14 flex-shrink-0">
                  <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#868CFF] to-[#4318FF] flex items-center justify-center text-[4rem] font-bold text-white shadow-[0_10px_20px_rgba(67,24,255,0.2)] mb-4">
                    {student.name ? student.name[0].toUpperCase() : "S"}
                  </div>
                  <h3 className="text-xl font-bold text-[#2B3674] mb-2">
                    {student.name}
                  </h3>
                  <span className="bg-[#F4F7FE] text-[#4318FF] px-4 py-1.5 text-sm font-bold rounded-lg">
                    {student.rollNo}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10 w-full">
                  <div>
                    <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-1">
                      Email Address
                    </span>
                    <h5 className="font-bold text-[#2B3674] text-sm break-all">
                      {student.email}
                    </h5>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-1">
                      Course
                    </span>
                    <h5 className="font-bold text-[#2B3674] text-sm">
                      {student.course}
                    </h5>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-1">
                      Branch
                    </span>
                    <h5 className="font-bold text-[#2B3674] text-sm">
                      {student.branch}
                    </h5>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-1">
                      Academic Year
                    </span>
                    <h5 className="font-bold text-[#2B3674] text-sm">
                      {student.year}
                    </h5>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-1">
                      Admission Category
                    </span>
                    <h5 className="font-bold text-[#2B3674] text-sm">
                      {student.category}
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: PAY ONLINE */}
        {activeTab === "pay" && (
          <div className="animate-fade-up">
            <div className="mb-10 text-center">
              <h2 className="font-bold text-[2.5rem] text-[#2B3674] mb-2">
                Secure Payment
              </h2>
              <p className="text-[#A3AED0] font-semibold text-sm">
                Pay your pending college fees instantly.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] max-w-[650px] mx-auto">
              {studentData?.totalPayable > 0 ? (
                <div className="max-w-[500px] mx-auto text-center">
                  <div className="mb-8">
                    <p className="text-sm text-[#A3AED0] font-bold uppercase tracking-wider mb-2">
                      Total Amount (Including Fine)
                    </p>
                    <h2 className="text-5xl font-black text-[#EE5D50] font-outfit">
                      ₹{studentData.totalPayable.toLocaleString()}
                    </h2>
                    {studentData.totalFine > 0 && (
                      <span className="inline-block mt-3 px-3.5 py-1 bg-red-50 text-red-500 rounded-full text-xs font-bold">
                        Includes ₹{studentData.totalFine} Late Fine
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleRazorpayPayment} className="text-left">
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-[#2B3674] mb-2">
                        Enter Amount to Pay
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#2B3674]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          max={studentData.totalPayable}
                          required
                          placeholder="0.00"
                          className="w-full bg-[#F4F7FE] border border-[#E0E5F2] rounded-2xl p-[15px_20px_15px_45px] text-2xl font-bold text-[#2B3674] focus:outline-none focus:bg-white focus:border-[#4318FF] focus:ring-4 focus:ring-[#4318FF]/10 transition-all"
                        />
                      </div>
                      <small className="block text-[#A3AED0] text-xs font-semibold mt-2.5">
                        * You can pay partial or full amount (including fine).
                      </small>
                    </div>

                    <button
                      type="submit"
                      disabled={payLoading}
                      className="w-full py-4.5 bg-[#4318FF] hover:bg-[#3311DB] disabled:opacity-50 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_10px_20px_rgba(67,24,255,0.2)] hover:shadow-[0_14px_25px_rgba(67,24,255,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {payLoading ? "Processing..." : "Pay Securely Now"}
                    </button>
                  </form>

                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#A3AED0] font-semibold">
                    <ShieldCheck className="w-5 h-5 text-[#05CD99]" />
                    256-bit Bank Grade Security
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-[100px] h-[100px] bg-[#E6FAF5] text-[#05CD99] rounded-full flex items-center justify-center text-[3rem] mx-auto mb-6">
                    <CheckCircle />
                  </div>
                  <h2 className="text-2xl font-bold text-[#2B3674] mb-3">
                    Outstanding!
                  </h2>
                  <p className="text-sm text-[#A3AED0] font-semibold leading-relaxed">
                    All your dues are cleared.
                    <br />
                    You have no pending payments at this time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: UPLOAD CHALLAN */}
        {activeTab === "upload" && (
          <div className="animate-fade-up">
            <div className="mb-10 text-center">
              <h2 className="font-bold text-[2.5rem] text-[#2B3674] mb-2">
                Upload Bank Challan
              </h2>
              <p className="text-[#A3AED0] font-semibold text-sm">
                Did you pay via Bank DD/RTGS? Upload your receipt for AI
                Auto-Verification.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)] max-w-[650px] mx-auto text-center">
              {uploadProgress ? (
                <div className="py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4318FF] mx-auto mb-5"></div>
                  <h5 className="font-bold text-[#2B3674] text-lg mb-1">
                    {uploadProgress}
                  </h5>
                  <p className="text-[#A3AED0] text-sm">
                    Extracting UTR and Amount via Gemini Vision
                  </p>
                </div>
              ) : uploadSuccess && ocrData ? (
                <div className="p-6 bg-[#E6FAF5] border border-[#05CD99]/30 rounded-3xl">
                  <CheckCircle className="w-12 h-12 text-[#05CD99] mx-auto mb-4" />
                  <h4 className="font-bold text-[#2B3674] text-xl mb-4">
                    Receipt Scanned Successfully!
                  </h4>

                  <div className="bg-white p-6 rounded-2xl text-left border border-slate-100 mb-4 space-y-3 text-sm">
                    <p className="mb-0 flex justify-between">
                      <strong className="text-slate-500">
                        Transaction ID (UTR):
                      </strong>
                      <span className="font-bold text-[#4318FF]">
                        {ocrData.utr}
                      </span>
                    </p>
                    <p className="mb-0 flex justify-between">
                      <strong className="text-slate-500">Amount Paid:</strong>
                      <span className="font-bold text-[#05CD99]">
                        ₹{ocrData.amount}
                      </span>
                    </p>
                    <p className="mb-0 flex justify-between">
                      <strong className="text-slate-500">Date:</strong>
                      <span className="font-bold text-slate-700">
                        {ocrData.date}
                      </span>
                    </p>
                  </div>

                  <p className="text-[#A3AED0] text-xs font-semibold mb-4">
                    Your receipt has been sent to the Admin for final approval.
                  </p>

                  <button
                    onClick={() => {
                      setUploadSuccess("");
                      setOcrData(null);
                      setSelectedFile(null);
                    }}
                    className="px-6 py-2.5 bg-[#4318FF] hover:bg-[#3311DB] text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Upload Another
                  </button>
                </div>
              ) : (
                <div
                  onClick={() =>
                    document.getElementById("receiptInput")?.click()
                  }
                  className="border-2 border-dashed border-[#A3AED0] hover:border-[#4318FF] bg-[#f8fafc] rounded-3xl p-16 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center"
                >
                  <Upload className="w-16 h-16 text-[#4318FF] mb-4" />
                  <h4 className="font-bold text-[#2B3674] text-lg mb-1">
                    Click to Upload Receipt
                  </h4>
                  <p className="text-[#A3AED0] text-sm">
                    JPEG, PNG, or JPG only
                  </p>
                  <input
                    type="file"
                    id="receiptInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {uploadError && (
                <div className="mt-5 p-4 bg-[#FFEDEC] border border-red-200 rounded-2xl text-red-500 text-sm font-semibold">
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: MY REQUESTS */}
        {activeTab === "requests" && (
          <div className="animate-fade-up">
            <div className="mb-10">
              <h2 className="font-bold text-[2.2rem] text-[#2B3674] mb-2">
                My Challan Requests
              </h2>
              <p className="text-[#A3AED0] font-semibold text-sm">
                Track the status of your offline challan submissions.
              </p>
            </div>

            {studentData?.offlineReceipts?.length > 0 ? (
              <div className="space-y-4">
                {studentData.offlineReceipts.map((r: OfflineReceipt) => (
                  <div
                    key={r.id}
                    className={`bg-white rounded-3xl p-6 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.06)] border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      r.status === "Approved"
                        ? "border-[#05CD99]"
                        : r.status === "Rejected"
                          ? "border-[#EE5D50]"
                          : "border-[#F59E0B]"
                    }`}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-3.5 mb-4">
                        <span
                          className={`text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider ${
                            r.status === "Approved"
                              ? "bg-[#ECFDF5] text-[#047857] border border-[#6EE7B7]"
                              : r.status === "Rejected"
                                ? "bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]"
                                : "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]"
                          }`}
                        >
                          {r.status === "Pending" ? "Pending Review" : r.status}
                        </span>
                        <span className="text-[#A3AED0] text-xs font-semibold">
                          Receipt #{r.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-6 max-w-[450px]">
                        <div>
                          <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-0.5">
                            UTR / Txn ID
                          </span>
                          <p className="font-bold text-sm text-[#2B3674] mb-0">
                            {r.extractedUtr || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-0.5">
                            Amount
                          </span>
                          <p className="font-bold text-sm text-[#05CD99] mb-0">
                            ₹{r.extractedAmount?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider block mb-0.5">
                            Submitted On
                          </span>
                          <p className="font-bold text-sm text-[#2B3674] mb-0">
                            {new Date(r.uploadDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      {r.status === "Rejected" && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                          Your challan was rejected. Please re-upload a clear
                          image or visit the accounts office.
                        </div>
                      )}
                      {r.status === "Pending" && (
                        <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium">
                          Your challan is under review. You will receive an
                          email once it is verified.
                        </div>
                      )}
                      {r.status === "Approved" && (
                        <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium">
                          Your payment has been verified and added to your fee
                          record.
                        </div>
                      )}
                    </div>

                    {/* Challan image preview right */}
                    {r.filePath && (
                      <a
                        href={getBackendUrl(`${r.filePath}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 border-2 border-slate-100 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity block"
                      >
                        <img
                          src={getBackendUrl(`${r.filePath}`)}
                          alt="Receipt Challan Preview"
                          className="w-[80px] h-[80px] object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as any).src =
                              "https://cdn-icons-png.flaticon.com/512/3342/3342137.png";
                          }}
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]">
                <div className="w-[80px] h-[80px] bg-[#F4F7FE] text-[#A3AED0] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  <FileText />
                </div>
                <h4 className="font-bold text-[#2B3674] text-lg mb-2">
                  No Challan Submissions Yet
                </h4>
                <p className="text-[#A3AED0] text-sm mb-5 leading-relaxed">
                  You haven't uploaded any offline challans. Go to Upload
                  Challan to submit one.
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="px-6 py-2.5 bg-[#4318FF] hover:bg-[#3311DB] text-white font-bold text-sm rounded-xl transition-all shadow-[0_10px_20px_rgba(67,24,255,0.15)]"
                >
                  Upload Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: RECEIPTS */}
        {activeTab === "receipts" && (
          <div className="animate-fade-up">
            <div className="mb-10">
              <h2 className="font-bold text-[2.2rem] text-[#2B3674] mb-2">
                Payment History
              </h2>
              <p className="text-[#A3AED0] font-semibold text-sm">
                View past transactions and download official receipts.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-[14px_17px_40px_4px_rgba(112,144,176,0.08)]">
              {studentData?.payments?.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 font-bold text-xs text-[#A3AED0] uppercase tracking-wider">
                          Transaction Date
                        </th>
                        <th className="pb-4 font-bold text-xs text-[#A3AED0] uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="pb-4 font-bold text-xs text-[#A3AED0] uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studentData.payments.map((pay: PaymentLog) => (
                        <tr key={pay.id}>
                          <td className="py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-[45px] h-[45px] rounded-full bg-[#F4F7FE] text-[#4318FF] flex items-center justify-center text-lg">
                                <History className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-sm text-[#2B3674]">
                                {new Date(pay.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 font-bold text-lg text-[#05CD99]">
                            + ₹{pay.amount.toLocaleString()}
                          </td>
                          <td className="py-5 text-right">
                            <a
                              href={getBackendUrl(`/api/student-portal/receipt-pdf/${pay.id}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-[#F4F7FE] hover:bg-[#4318FF] text-[#4318FF] hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                            >
                              Download PDF
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-[80px] h-[80px] bg-[#F4F7FE] text-[#A3AED0] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    <History />
                  </div>
                  <h4 className="font-bold text-[#2B3674] text-lg mb-2">
                    No Transactions Yet
                  </h4>
                  <p className="text-[#A3AED0] text-sm leading-relaxed">
                    You haven't made any payments so far.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* AI Chatbot Widget Floating Button & Window */}
      <div
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-[30px] right-[30px] w-[65px] h-[65px] bg-gradient-to-br from-[#868CFF] to-[#4318FF] text-white rounded-full flex items-center justify-center text-3xl shadow-[0_10px_25px_rgba(67,24,255,0.4)] cursor-pointer hover:scale-105 transition-transform z-[9999]"
      >
        <MessageSquare className="w-7 h-7" />
      </div>

      {chatOpen && (
        <div className="fixed bottom-[110px] right-[30px] w-[350px] h-[450px] bg-white rounded-[20px] shadow-[0_15px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-slate-100 z-[9999] animate-fade-up">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#868CFF] to-[#4318FF] text-white p-[15px_20px] flex justify-between items-center font-bold text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              EduAI Assistant
            </div>
            <X
              className="cursor-pointer w-4 h-4"
              onClick={() => setChatOpen(false)}
            />
          </div>

          {/* Chat Body */}
          <div className="flex-grow p-[15px] overflow-y-auto flex flex-col gap-2.5 bg-[#f8fafc]">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-[10px_15px] rounded-2xl text-[0.95rem] line-relaxed ${
                  msg.sender === "bot"
                    ? "bg-white text-[#2B3674] self-start rounded-bl-none shadow-[0_2px_5px_rgba(0,0,0,0.05)]"
                    : "bg-[#4318FF] text-white self-end rounded-br-none shadow-[0_2px_5px_rgba(67,24,255,0.2)]"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {botLoading && (
              <div className="bg-white text-[#2B3674] self-start rounded-bl-none shadow-[0_2px_5px_rgba(0,0,0,0.05)] p-[10px_15px] rounded-2xl text-[0.95rem] w-max animate-pulse">
                ...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 flex items-center border-t border-slate-100 bg-white gap-2"
          >
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow border-none bg-[#f1f5f9] p-[10px_15px] rounded-[20px] outline-none text-sm"
              required
            />
            <button
              type="submit"
              disabled={botLoading}
              className="p-2.5 text-[#4318FF] disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
