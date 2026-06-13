"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  AlertOctagon,
  LogOut,
  BarChart3,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: Users },
    { name: "Fees", href: "/fees", icon: CreditCard },
    { name: "Payments", href: "/payments", icon: Receipt },
    {
      name: "Defaulters",
      href: "/defaulters",
      icon: AlertOctagon,
      isDefaulter: true,
    },
    { name: "Reports", href: "/reports", icon: BarChart3, isReports: true },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <aside className="w-[280px] bg-[#0f172a]/85 backdrop-blur-[25px] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0 text-white z-20 p-[2.5rem_1.5rem] shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
      {/* Brand Header */}
      <div className="text-center mb-12">
        <Link
          href="/dashboard"
          className="font-outfit font-extrabold text-[1.8rem] text-slate-100 hover:text-white flex items-center justify-center gap-3 drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all hover:scale-105 group"
        >
          <Shield className="w-8 h-8 text-[#8b5cf6] filter drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
          Fee System
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 flex flex-col gap-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          let activeStyles =
            "bg-[#8b5cf6]/15 border-[#8b5cf6]/30 text-white shadow-[inset_0_0_15px_rgba(139,92,246,0.1)] translate-x-[5px]";
          let activeIconStyles =
            "text-[#8b5cf6] filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]";

          if (item.isDefaulter) {
            activeStyles =
              "bg-[#f43f5e]/15 border-[#f43f5e]/30 text-white shadow-[inset_0_0_15px_rgba(244,63,94,0.1)] translate-x-[5px]";
            activeIconStyles =
              "text-[#f43f5e] filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]";
          } else if (item.isReports) {
            activeStyles =
              "bg-[#eab308]/15 border-[#eab308]/30 text-white shadow-[inset_0_0_15px_rgba(234,179,8,0.1)] translate-x-[5px]";
            activeIconStyles =
              "text-[#eab308] filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]";
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-350 border border-transparent group ${
                isActive
                  ? activeStyles
                  : item.isDefaulter
                    ? `text-[#94a3b8] hover:bg-[#f43f5e]/15 hover:text-white hover:border-[#f43f5e]/30 hover:shadow-[inset_0_0_15px_rgba(244,63,94,0.1)] hover:translate-x-[5px]`
                    : item.isReports
                      ? `text-[#94a3b8] hover:bg-[#eab308]/15 hover:text-white hover:border-[#eab308]/30 hover:shadow-[inset_0_0_15px_rgba(234,179,8,0.1)] hover:translate-x-[5px]`
                      : `text-[#94a3b8] hover:bg-[#8b5cf6]/15 hover:text-white hover:border-[#8b5cf6]/30 hover:shadow-[inset_0_0_15px_rgba(139,92,246,0.1)] hover:translate-x-[5px]`
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-all group-hover:scale-105 duration-350 ${
                  isActive
                    ? activeIconStyles
                    : item.isDefaulter
                      ? "text-[#64748b] group-hover:text-[#f43f5e] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      : item.isReports
                        ? "text-[#64748b] group-hover:text-[#eab308] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                        : "text-[#64748b] group-hover:text-[#8b5cf6] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                }`}
              />
              {item.name}
            </Link>
          );
        })}

        {/* Sign Out Button (danger-link style) */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3.5 px-5 py-3.5 text-[#94a3b8] hover:text-white hover:bg-[#ff0844]/15 hover:border-[#ff0844]/30 hover:shadow-[inset_0_0_15px_rgba(255,8,68,0.1)] hover:scale-[1.02] border border-transparent rounded-xl font-semibold text-sm transition-all duration-350 group"
        >
          <LogOut className="w-5 h-5 text-[#64748b] group-hover:text-[#ff0844] group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(255,8,68,0.6)]" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
