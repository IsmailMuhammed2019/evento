"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    // Check if user is logged in as student or admin
    const studentInfo = localStorage.getItem('studentInfo');
    const adminInfo = localStorage.getItem('adminInfo');
    
    // If on admin pages, show admin navigation if admin is logged in
    if (pathname.startsWith('/admin') || pathname === '/generate') {
      setIsStudent(!adminInfo); // Show student nav if no admin login
    } else {
      // Otherwise, check if student is logged in
      setIsStudent(!!studentInfo);
    }
  }, [pathname]);

  // Don't show navigation on landing page
  if (pathname === "/") {
    return null;
  }

  // Student navigation (simplified)
  if (isStudent) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              href="/scanner"
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                pathname === "/scanner"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Scanner
            </Link>
            <Link
              href="/records"
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                pathname === "/records"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Records
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Admin logout function
  const handleAdminLogout = () => {
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
  };

  // Admin navigation (full features)
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
            <Link
              href="/admin/daily-qr"
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                pathname === "/admin/daily-qr"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Daily QR
            </Link>
            <Link
              href="/admin"
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                pathname === "/admin"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Admin Dashboard
            </Link>
            <Link
              href="/generate"
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                pathname === "/generate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Generate QR
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Admin
            </span>
            <button
              onClick={handleAdminLogout}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
