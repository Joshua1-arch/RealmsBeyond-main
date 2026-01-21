"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDashboard, MdInventory, MdSettings, MdPeople, MdShoppingCart, MdEdit } from "react-icons/md";

export default function Topbar() {
  const [time, setTime] = useState(new Date());
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: <MdDashboard className="w-4 h-4" /> },
    { name: "Goods", href: "/admin/goods", icon: <MdInventory className="w-4 h-4" /> },
    { name: "Orders", href: "/admin/orders", icon: <MdShoppingCart className="w-4 h-4" /> },
    { name: "Users", href: "/admin/users", icon: <MdPeople className="w-4 h-4" /> },
    { name: "Blog", href: "/admin/Blog", icon: <MdEdit className="w-4 h-4" /> },
    { name: "Settings", href: "/admin/settings", icon: <MdSettings className="w-4 h-4" /> },
  ];

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-8 shadow-lg bg-gradient-blue/90 backdrop-blur-md text-white border-b border-white/10 sticky top-0 z-50">
      {/* Left section: Brand */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group" title="Back to Home">
          <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all">
            <img src="/logo.png" alt="BeyondRealms" className="h-7 w-7 rounded-full" />
          </div>
          <span className="text-xl font-heading font-normal tracking-wide text-white">Admin</span>
        </Link>

        {/* Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all duration-200 ${isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right section: Info */}
      <div className="flex items-center gap-8">
        {/* View Live Site Button */}


        {/* Current time */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-body">System Time</span>
          <div className="font-mono text-xs text-white/90">{time.toLocaleTimeString()}</div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 pl-8 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">Admin User</span>
            <span className="text-[10px] text-white/50 uppercase tracking-tighter font-body">Realms Beyond LTD</span>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-50 group-hover:opacity-100 blur transition duration-300"></div>
            <img
              src="/admin-logo.png"
              alt="Admin"
              className="relative h-10 w-10 rounded-full border border-white/20 object-cover shadow-xl"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
