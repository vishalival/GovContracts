"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white p-4">
      <div className="mb-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Navigation</div>
      <nav className="space-y-2">
        <Link
          href="/"
          className={`block rounded-md px-3 py-2 text-sm ${
            pathname === "/" ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Overview
        </Link>
        <div className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-gray-400">Contracts</div>
        <div className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-gray-400">Vendors</div>
        <div className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-gray-400">Budgets</div>
        <div className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-gray-400">Settings</div>
      </nav>

      <div className="mb-3 mt-7 text-xs font-semibold uppercase tracking-wide text-gray-500">References</div>
      <nav className="space-y-2">
        <Link
          href="/api-docs"
          className={`block rounded-md px-3 py-2 text-sm ${
            pathname === "/api-docs" ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          API Docs
        </Link>
      </nav>
    </aside>
  );
}
