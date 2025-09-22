"use client";

import { useState, useRef, useEffect } from "react";
import { User, Calendar, Clock, LogIn, LogOut, QrCode, Camera, History, CheckCircle, XCircle } from "lucide-react";
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

  // Calculate today's status based on attendance records
  const getTodayStatus = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === today);
    
    if (todayRecords.length === 0) {
      return { status: "Not Signed In", records: 0, hours: 0 };
    }
    
    const signInRecord = todayRecords.find(r => r.type === 'in');
    const signOutRecord = todayRecords.find(r => r.type === 'out');
    
    if (signInRecord && signOutRecord) {
      try {
        const signInTime = new Date(`${today}T${signInRecord.time}`);
        const signOutTime = new Date(`${today}T${signOutRecord.time}`);
        const hoursWorked = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursWorked >= 7) {
          return { status: "Present", records: todayRecords.length, hours: hoursWorked };
        } else {
          return { status: "Absent", records: todayRecords.length, hours: hoursWorked };
        }
      } catch (error) {
        return { status: "Partial", records: todayRecords.length, hours: 0 };
      }
    } else if (signInRecord) {
      return { status: "Partial", records: todayRecords.length, hours: 0 };
    } else {
      return { status: "Not Signed In", records: todayRecords.length, hours: 0 };
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Student Portal</h1>
                <p className="text-gray-600 text-sm sm:text-base">Welcome, {studentName}</p>
                <p className="text-xs sm:text-sm text-gray-500">ID: {studentId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl mr-3">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                Scan Daily QR Code
              </h2>
              <button
                onClick={toggleScanner}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {showScanner ? "Hide Scanner" : "Scan QR Code"}
              </button>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center">
                Scan the daily QR code displayed by admin
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                Direct Sign In/Out
              </h2>
              <button
                onClick={handleSignInOut}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Sign In/Out"
                )}
              </button>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center">
                Click to sign in or out directly
              </p>
            </div>
          </div>

          {/* QR Scanner */}
          {showScanner && (
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-xl mr-3">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl mr-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Today's Status
              </h2>
              <div className="text-center">
                {(() => {
                  const todayStatus = getTodayStatus();
                  return (
                    <>
                      <div className={`text-xl sm:text-2xl font-bold mb-2 ${
                        todayStatus.status === "Present" ? "text-green-600" :
                        todayStatus.status === "Partial" ? "text-yellow-600" :
                        todayStatus.status === "Absent" ? "text-red-600" : "text-gray-600"
                      }`}>
                        {todayStatus.status}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {todayStatus.records} records today
                        {todayStatus.hours > 0 && ` • ${todayStatus.hours.toFixed(1)}h worked`}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-xl mr-3">
                  <History className="h-5 w-5 text-white" />
                </div>
                View Records
              </h2>
              <div className="text-center">
                <button
                  onClick={() => window.location.href = '/records'}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  View All Records
                </button>
                <p className="text-xs sm:text-sm text-gray-500 mt-3">
                  Check your complete attendance history
                </p>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded-xl mr-3">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Recent Attendance History
            </h2>
            
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No attendance records found.</p>
                <p className="text-xs mt-2">Your attendance will appear here once you start signing in/out.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className={`flex justify-between items-center p-3 sm:p-4 rounded-xl border-l-4 ${
                      record.type === "in" 
                        ? "bg-green-50 border-green-500" 
                        : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      {record.type === "in" ? (
                        <LogIn className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                      ) : (
                        <LogOut className="h-4 w-4 text-red-600 mr-3 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base">
                          {record.type === "in" ? "Signed In" : "Signed Out"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base">{record.time}</p>
                    </div>
                  </div>
                ))}
                {attendanceRecords.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => window.location.href = '/records'}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Records ({attendanceRecords.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Student Portal</h1>
            <p className="text-gray-600 text-sm sm:text-base">Sign in with your Student ID</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.includes("successful") 
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <div className="flex items-center">
                {message.includes("successful") ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Student ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              Don't have a Student ID? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
