"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDashboard, MdInventory, MdSettings, MdPeople, MdShoppingCart, MdEdit } from "react-icons/md";

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: <MdDashboard className="w-5 h-5" /> },
    { name: "Manage Goods", href: "/admin/goods", icon: <MdInventory className="w-5 h-5" /> },
    { name: "Orders", href: "/admin/orders", icon: <MdShoppingCart className="w-5 h-5" /> },
    { name: "Users", href: "/admin/users", icon: <MdPeople className="w-5 h-5" /> },
    { name: "Blog", href: "/admin/Blog", icon: <MdEdit className="w-5 h-5" /> },
    { name: "Settings", href: "/admin/settings", icon: <MdSettings className="w-5 h-5" /> },
  ];

  return (
    <aside className="h-screen w-64 bg-gradient-blue/90 backdrop-blur-md dark:border-gray-800 p-5 text-white border-r border-white/10">
      <h1 className="mb-8 text-xl font-bold text-white">Admin Portal</h1>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                ? "bg-blue-600 text-white"
                : "text-gray-200 hover:text-white hover:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
            >

              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
