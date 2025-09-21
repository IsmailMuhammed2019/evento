"use client";

import { useState } from "react";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Handle admin login
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setMessage("Please enter both username and password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username,
          password: password 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store admin info in localStorage
        localStorage.setItem('adminInfo', JSON.stringify({
          username: username,
          role: data.role || 'admin',
          loginTime: new Date().toISOString()
        }));
        
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          router.push('/admin/daily-qr');
        }, 1000);
      } else {
        const error = await response.json();
        setMessage(error.error || "Invalid username or password");
      }
    } catch (error) {
      setMessage("Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
            <p className="text-gray-600">Enter your admin credentials to access the dashboard</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes("successful") 
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Admin Login
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Default credentials: admin / admin123
            </p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Student Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
