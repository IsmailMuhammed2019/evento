"use client";

import { useState } from "react";
import { User, LogIn, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Handle student login
  const handleLogin = async () => {
    if (!studentId.trim() || !studentName.trim()) {
      setMessage("Please enter both your App ID and Name");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Validate student exists in database
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_id: studentId,
          student_name: studentName 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store student info in session/localStorage for scanner page
        localStorage.setItem('studentInfo', JSON.stringify({
          student_id: studentId,
          student_name: studentName,
          department: data.department || 'Unknown'
        }));
        
        // Redirect to scanner page
        router.push('/scanner');
      } else {
        const error = await response.json();
        setMessage(error.error || "Invalid App ID or Name. Please check and try again.");
      }
    } catch (error) {
      setMessage("Login failed. Please check your App ID and Name.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Attendance</h1>
            <p className="text-gray-600">Enter your App ID and Name to access the scanner</p>
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
                App ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your App ID (e.g., APP-2025-97698)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name (e.g., Ismail Muhammed)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Access Scanner
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an App ID? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}