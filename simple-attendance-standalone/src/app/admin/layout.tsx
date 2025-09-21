"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if admin is logged in
    const adminInfo = localStorage.getItem('adminInfo');
    
    if (!adminInfo && pathname !== '/admin/login') {
      // Not logged in and not on login page, redirect to login
      router.push('/admin/login');
    } else if (adminInfo) {
      // Logged in, allow access
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, [pathname, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated && pathname !== '/admin/login') {
    return null; // Will redirect to login
  }

  // Show the admin content
  return <>{children}</>;
}
