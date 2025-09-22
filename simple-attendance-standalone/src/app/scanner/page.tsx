"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { QrCode, Camera, CheckCircle, XCircle, User, History, LogOut, Eye, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface StudentInfo {
  student_id: string;
  student_name: string;
  department: string;
}

export default function ScannerPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scansToday, setScansToday] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  // Load student info and check today's scans
  useEffect(() => {
    const storedInfo = localStorage.getItem('studentInfo');
    if (storedInfo) {
      const info = JSON.parse(storedInfo);
      setStudentInfo(info);
      checkTodayScans(info.student_id);
    } else {
      // No student info, redirect to login
      router.push('/');
    }
  }, []);

  // Check how many times student has scanned today
  const checkTodayScans = async (studentId: string) => {
    try {
      const response = await fetch(`/api/student/attendance/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const todayScans = data.filter((record: any) => record.date === today);
        setScansToday(todayScans.length);
      }
    } catch (error) {
      console.log("Could not check today's scans:", error);
    }
  };

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Ensure scanner div is available when isScanning changes
  useEffect(() => {
    if (isScanning) {
      // Force a re-render to ensure the scanner div is in the DOM
      const timer = setTimeout(() => {
        const scannerElement = document.getElementById("scanner");
        if (scannerElement) {
          console.log("Scanner div found and ready");
        } else {
          console.log("Scanner div not found, retrying...");
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  // Start camera scanning using html5-qrcode
  const startScanning = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      setMessage("Starting camera scanner...");
      
      // Wait for the scanner div to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if scanner div exists
      const scannerElement = document.getElementById("scanner");
      if (!scannerElement) {
        throw new Error("Scanner element not found. Please try again.");
      }
      
      // Create html5-qrcode instance (no file upload option)
      scannerRef.current = new Html5Qrcode("scanner");

      // Start camera scanning
      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
      
      setMessage("Camera ready. Point at QR code to scan.");
      toast.success("Scanner started successfully!");
      
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast.error("Failed to start scanner. Please check permissions.");
      setIsScanning(false);
      setMessage("Scanner failed to start. Please check permissions.");
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    await cleanup();
    setMessage("Scanner stopped.");
  };

  // Handle successful QR scan
  const onScanSuccess = async (decodedText: string) => {
    if (!studentInfo) return;

    try {
      // Stop scanning temporarily
          await cleanup();

      setLoading(true);

      const response = await fetch('/api/student/scan-daily-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          student_id: studentInfo.student_id,
          qr_token: decodedText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setMessage(data.message);
        
        // Refresh the scans count from the server
        await checkTodayScans(studentInfo.student_id);
        
        // If this was the second scan, redirect to records after 2 seconds
        if (data.type === 'out') {
          setTimeout(() => {
            router.push('/records');
          }, 2000);
        }
      } else {
        const error = await response.json();
        toast.error(error.error);
        setMessage(error.error);
      }

      // Don't automatically restart scanner - let user decide
      // Scanner will only restart if user clicks "Start Camera Scanner" again

    } catch (error) {
      toast.error("Error processing scan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scan failure (not used in custom implementation)
  const onScanFailure = (error: string) => {
    // This is expected for every scan attempt, so we don't log it
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('studentInfo');
    router.push('/');
  };

  if (!studentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Daily Attendance Scanner
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, <span className="font-semibold text-blue-600">{studentInfo.student_name}</span></p>
                <p className="text-xs sm:text-sm text-gray-500">Student ID: {studentInfo.student_id}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => router.push('/records')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <History className="h-4 w-4" />
                <span>View Records</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-8 p-4 sm:p-6 rounded-2xl shadow-lg border-2 ${
            message.includes("Successfully") 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800"
              : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center space-x-3">
              {message.includes("Successfully") ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
              )}
              <p className="font-semibold text-sm sm:text-lg">{message}</p>
            </div>
          </div>
        )}

        {/* Scanner Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className={`rounded-2xl shadow-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 ${
            scansToday >= 1 
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
              : "bg-white border-2 border-gray-200"
          }`}>
            <div className="flex justify-center mb-3">
              {scansToday >= 1 ? (
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              ) : (
                <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              )}
            </div>
            <h3 className={`text-lg sm:text-xl font-bold ${scansToday >= 1 ? "text-white" : "text-gray-800"}`}>Sign In</h3>
            <p className={`text-xs sm:text-sm mt-2 ${scansToday >= 1 ? "text-green-100" : "text-gray-600"}`}>
              {scansToday >= 1 ? "✓ Completed" : "⏳ Not signed in"}
            </p>
          </div>

          <div className={`rounded-2xl shadow-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-all duration-300 ${
            scansToday >= 2 
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" 
              : "bg-white border-2 border-gray-200"
          }`}>
            <div className="flex justify-center mb-3">
              {scansToday >= 2 ? (
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              ) : (
                <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              )}
            </div>
            <h3 className={`text-lg sm:text-xl font-bold ${scansToday >= 2 ? "text-white" : "text-gray-800"}`}>Sign Out</h3>
            <p className={`text-xs sm:text-sm mt-2 ${scansToday >= 2 ? "text-green-100" : "text-gray-600"}`}>
              {scansToday >= 2 ? "✓ Completed" : "⏳ Not signed out"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-4 sm:p-6 text-center text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-3">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Today's Progress</h3>
            <p className="text-xs sm:text-sm mt-2 text-blue-100">{scansToday}/2 scans completed</p>
            <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(scansToday / 2) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Scanner */}
        {scansToday < 2 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-xl">
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Scan Daily QR Code</h2>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <div className="min-h-[300px] sm:min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center relative">
                  {!isScanning && (
                    <div className="text-center p-4">
                      <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4 text-sm sm:text-base">Camera scanner ready</p>
                      <button
                        onClick={startScanning}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                      >
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                        <span className="font-semibold">Start Camera Scanner</span>
                      </button>
                    </div>
                  )}
                  {isScanning && (
                    <div className="relative w-full h-full">
                      <div id="scanner" className="w-full h-full"></div>
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                        <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                          <div className="animate-pulse">
                            <Camera className="h-4 w-4 inline mr-2" />
                            Scanning...
                          </div>
                        </div>
                        <button
                          onClick={stopScanning}
                          disabled={loading}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <span className="font-semibold">Stop Scanner</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Point your camera at the daily QR code displayed by the admin
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Maximum 2 scans per day (Sign In + Sign Out)
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-xl">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-green-800 mb-4">🎉 Attendance Complete!</h2>
            <p className="text-green-700 mb-6 text-lg">
              You have successfully signed in and out for today. Great job!
            </p>
            <button
              onClick={() => router.push('/records')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center mx-auto space-x-2"
            >
              <Eye className="h-5 w-5" />
              <span className="font-semibold text-lg">View Your Records</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
