"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Plus, Search, Edit2, Trash2, X, GraduationCap } from "lucide-react";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  course: string;
  year: string;
  branch: string;
  category: string;
  email: string;
}

export default function StudentManagement() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [year, setYear] = useState("First Year");
  const [branch, setBranch] = useState("Computer Science");
  const [category, setCategory] = useState("Open");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/login");
    } else {
      fetchStudents();
    }
  }, [router]);

  const fetchStudents = async (query = "") => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/students${query ? `?search=${query}` : ""}`,
      );
      setStudents(response.data);
    } catch (err) {
      setError("Failed to fetch students data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(search);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName("");
    setRollNo("");
    setCourse("B.Tech");
    setYear("First Year");
    setBranch("Computer Science");
    setCategory("Open");
    setEmail("");
    setIsOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setRollNo(student.rollNo);
    setCourse(student.course);
    setYear(student.year);
    setBranch(student.branch);
    setCategory(student.category);
    setEmail(student.email);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = { name, rollNo, course, year, branch, category, email };

    try {
      if (editingStudent) {
        // Edit student
        await axios.put(
          `http://localhost:8080/api/students/${editingStudent.id}`,
          payload,
        );
      } else {
        // Add student
        await axios.post("http://localhost:8080/api/students", payload);
      }
      setIsOpen(false);
      fetchStudents(search);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save student details.");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this student and all their associated fee records?",
      )
    ) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/api/students/${id}`);
      fetchStudents(search);
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex font-poppins">
      <Sidebar />

      <main className="flex-1 ml-[280px] p-[2.5rem_3.5rem] min-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white heading-underline">
              Student Directory
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage enrollments, branches, and categories
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="btn-glow-primary hover:brightness-110 text-white py-3 px-6 rounded-full font-bold flex items-center gap-2 shadow-lg transform active:scale-95 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b39ddb]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name..."
              className="w-full pl-[50px] pr-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-[#2a2a40] hover:bg-[#32324e] border border-white/10 py-3 px-6 rounded-full font-semibold text-sm transition-all text-[#e2d8fa]"
          >
            Search
          </button>
        </form>

        {/* Student Directory Table */}
        <section className="glass-card p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8b5cf6] mx-auto"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-hidden">
              <table className="glass-table w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-[#e2e8f0] uppercase tracking-wider">
                    <th className="p-4">Sr. No.</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Course & Year</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="text-sm">
                      <td className="p-4 font-semibold text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-[#8b5cf6]" />
                          {student.name}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-[#b39ddb] font-mono text-xs">
                        {student.rollNo}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">
                          {student.course}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {student.year}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{student.branch}</td>
                      <td className="p-4">
                        <span className="inline-flex text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#1e293b]/60 border border-white/5 text-[#e2e8f0]">
                          {student.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {student.email}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2.5 bg-[#2a2a40] hover:bg-[#32324e] border border-white/10 rounded-lg text-[#e2d8fa] hover:text-white transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2.5 bg-rose-950/20 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-rose-400 hover:text-white transition-all shadow-[0_4px_10px_rgba(244,63,94,0.15)]"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No students found. Add one to get started!
            </div>
          )}
        </section>
      </main>

      {/* Modal - Add & Edit Student */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e2f]/95 border border-white/10 rounded-[15px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#2a2a40]/30">
              <h3 className="font-outfit font-bold text-lg text-white">
                {editingStudent ? "Edit Student Details" : "Add New Student"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                    placeholder="e.g. ROLL101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="OBC">OBC</option>
                    <option value="VJ/NT">VJ/NT</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="OMS">OMS</option>
                    <option value="Mgmt.Quota">Mgmt.Quota</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                    Course
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm"
                  >
                    <option value="B. Tech">B. Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="BCCA">BCCA</option>
                    <option value="BSC">BSC</option>
                    <option value="M.SC">M.SC</option>
                    <option value="Polytechnic">Polytechnic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                    Admission Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Direct Second Yr.">
                      Direct Second Yr. (DSY)
                    </option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                  placeholder="e.g. Computer Science, Mechanical"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e2d8fa] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-[#2a2a40] border border-white/10 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-[#b39ddb]/30 focus:border-[#b39ddb]/50 text-sm placeholder-[#8b8b99]"
                  placeholder="e.g. student@college.edu"
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
                  {editingStudent ? "Save Changes" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
