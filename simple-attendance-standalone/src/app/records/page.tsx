"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, ArrowLeft, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  type: "in" | "out";
  created_at: string;
}

interface StudentInfo {
  student_id: string;
  student_name: string;
  department: string;
}

export default function RecordsPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load student info and attendance records
  useEffect(() => {
    const storedInfo = localStorage.getItem('studentInfo');
    if (storedInfo) {
      const info = JSON.parse(storedInfo);
      setStudentInfo(info);
      loadAttendanceRecords(info.student_id);
    } else {
      // No student info, redirect to login
      router.push('/');
    }
  }, []);

  const loadAttendanceRecords = async (studentId: string) => {
    try {
      const response = await fetch(`/api/student/attendance/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.log("Could not load attendance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentInfo');
    router.push('/');
  };

  const goToScanner = () => {
    router.push('/scanner');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Your Attendance Records</h1>
              <p className="text-gray-600">Welcome, {studentInfo.student_name}</p>
              <p className="text-sm text-gray-500">ID: {studentInfo.student_id} • {studentInfo.department}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={goToScanner}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Scanner
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Today's Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
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
              {attendanceRecords.slice(0, 20).map((record) => (
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
              
              {attendanceRecords.length > 20 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Showing latest 20 records</p>
                  <p className="text-xs">Total records: {attendanceRecords.length}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
