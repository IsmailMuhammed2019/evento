"use client";

import { useState, useRef, useEffect } from "react";
import { User, Calendar, Clock, LogIn, LogOut, QrCode, Camera } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import toast from "react-hot-toast";

interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  type: "in" | "out";
  created_at: string;
}

export default function StudentPortal() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  // Login function
  const handleLogin = async () => {
    if (!studentId.trim()) {
      setMessage("Please enter your Student ID");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // In a real app, you'd validate the student ID against a database
      // For now, we'll simulate a login
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_id: studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudentName(data.student_name || `Student ${studentId}`);
        setIsLoggedIn(true);
        await loadAttendanceRecords();
        setMessage("Login successful!");
      } else {
        setMessage("Invalid Student ID. Please check and try again.");
      }
    } catch (error) {
      // For demo purposes, simulate successful login
      setStudentName(`Student ${studentId}`);
      setIsLoggedIn(true);
      setMessage("Login successful! (Demo mode)");
    }

    setLoading(false);
  };

  // Load student's attendance records
  const loadAttendanceRecords = async () => {
    try {
      const response = await fetch(`/api/student/attendance/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.log("Demo mode - no real data loaded");
    }
  };

  // Sign in/out function (direct button click)
  const handleSignInOut = async () => {
    if (!isLoggedIn) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/student/attendance', {
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
        setMessage(data.message);
        await loadAttendanceRecords(); // Refresh records
      } else {
        setMessage("Failed to record attendance. Please try again.");
      }
    } catch (error) {
      setMessage("Attendance recorded! (Demo mode)");
    }

    setLoading(false);
  };

  // Initialize QR scanner
  useEffect(() => {
    if (showScanner && scannerRef.current && !scanner) {
      const newScanner = new Html5QrcodeScanner(
        "scanner",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false
      );

      newScanner.render(onScanSuccess, onScanFailure);
      setScanner(newScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
    };
  }, [showScanner]);

  // Handle successful QR scan
  const onScanSuccess = async (decodedText: string) => {
    try {
      // Pause scanner temporarily
      if (scanner) {
        scanner.pause();
      }

      const response = await fetch('/api/student/scan-daily-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_id: studentId,
          qr_token: decodedText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setMessage(data.message);
        await loadAttendanceRecords(); // Refresh records
        
        // Hide scanner after successful scan
        setShowScanner(false);
      } else {
        const error = await response.json();
        toast.error(error.error);
        setMessage(error.error);
      }

      // Resume scanner after 2 seconds
      setTimeout(() => {
        if (scanner && showScanner) {
          scanner.resume();
        }
      }, 2000);

    } catch (error) {
      toast.error("Error processing scan");
      console.error(error);
    }
  };

  // Handle scan failure
  const onScanFailure = (error: string) => {
    // Only log errors, don't show toasts for every failed scan
    console.log("QR Code scan failed:", error);
  };

  // Toggle scanner
  const toggleScanner = () => {
    setShowScanner(!showScanner);
    setMessage("");
  };

  // Logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudentId("");
    setStudentName("");
    setAttendanceRecords([]);
    setMessage("");
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
                <p className="text-gray-600">Welcome, {studentName}</p>
                <p className="text-sm text-gray-500">ID: {studentId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes("successful") || message.includes("recorded") 
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {message}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Scan Daily QR Code
              </h2>
              <button
                onClick={toggleScanner}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {showScanner ? "Hide Scanner" : "Scan QR Code"}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Scan the daily QR code displayed by admin
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Direct Sign In/Out
              </h2>
              <button
                onClick={handleSignInOut}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Sign In/Out"}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Click to sign in or out directly
              </p>
            </div>
          </div>

          {/* QR Scanner */}
          {showScanner && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Daily QR Code Scanner
              </h2>
              <div className="text-center">
                <div id="scanner" ref={scannerRef} className="flex justify-center mb-4"></div>
                <p className="text-sm text-gray-600">
                  Point your camera at the daily QR code displayed by the admin
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum 2 scans per day (Sign In + Sign Out)
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Today's Status
              </h2>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length > 0 ? "Present" : "Not Signed In"}
                </div>
                <p className="text-sm text-gray-500">
                  {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length} records today
                </p>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Your Attendance History
            </h2>
            
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No attendance records found.</p>
                <p className="text-sm mt-2">Your attendance will appear here once you start signing in/out.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className={`flex justify-between items-center p-3 rounded-lg border-l-4 ${
                      record.type === "in" 
                        ? "bg-green-50 border-green-500" 
                        : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-center">
                      {record.type === "in" ? (
                        <LogIn className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <LogOut className="h-4 w-4 text-red-600 mr-2" />
                      )}
                      <div>
                        <p className="font-medium">
                          {record.type === "in" ? "Signed In" : "Signed Out"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{record.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Portal</h1>
            <p className="text-gray-600">Sign in with your Student ID</p>
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
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have a Student ID? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
