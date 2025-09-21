"use client";

import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

// Simple Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AttendanceRecord {
  id?: number;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  type: "in" | "out";
  created_at?: string;
}

export default function SimpleAttendance() {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const scannerRef = useRef<HTMLDivElement>(null);

  // Initialize scanner
  useEffect(() => {
    if (scannerRef.current && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "scanner",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  // Handle successful scan
  const onScanSuccess = async (decodedText: string) => {
    try {
      // Parse QR code data (format: "student_id,student_name")
      const [studentId, studentName] = decodedText.split(",");
      
      if (!studentId || !studentName) {
        toast.error("Invalid QR code format");
        return;
      }

      // Pause scanner temporarily
      if (scanner) {
        scanner.pause();
      }

      // Check if student already signed in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecords } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .eq("date", today)
        .order("time", { ascending: false });

      // Determine if this should be sign-in or sign-out
      const lastRecord = existingRecords?.[0];
      const shouldSignIn = !lastRecord || lastRecord.type === "out";

      // Create new attendance record
      const newRecord: AttendanceRecord = {
        student_id: studentId,
        student_name: studentName,
        date: today,
        time: new Date().toLocaleTimeString(),
        type: shouldSignIn ? "in" : "out",
      };

      const { data, error } = await supabase
        .from("attendance")
        .insert([newRecord])
        .select();

      if (error) {
        toast.error("Failed to record attendance");
        console.error(error);
        return;
      }

      // Update recent records
      setRecentRecords(prev => [data[0], ...prev.slice(0, 9)]);
      
      // Show success message
      toast.success(`${studentName} signed ${shouldSignIn ? "IN" : "OUT"} at ${newRecord.time}`);

      // Resume scanner after 2 seconds
      setTimeout(() => {
        if (scanner) {
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

  // Load recent records on mount
  useEffect(() => {
    const loadRecentRecords = async () => {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data) {
        setRecentRecords(data);
      }
    };

    loadRecentRecords();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Simple Attendance System
        </h1>

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Scan QR Code</h2>
          <div id="scanner" ref={scannerRef} className="flex justify-center"></div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentRecords.map((record) => (
                <div
                  key={record.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    record.type === "in" 
                      ? "bg-green-50 border-l-4 border-green-500" 
                      : "bg-red-50 border-l-4 border-red-500"
                  }`}
                >
                  <div>
                    <p className="font-medium">{record.student_name}</p>
                    <p className="text-sm text-gray-600">ID: {record.student_id}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      record.type === "in" ? "text-green-700" : "text-red-700"
                    }`}>
                      {record.type === "in" ? "SIGNED IN" : "SIGNED OUT"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.date} at {record.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
