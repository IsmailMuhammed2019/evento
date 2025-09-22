"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, ArrowLeft, LogIn, LogOut, User, History, QrCode, CheckCircle, XCircle, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <History className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Your Attendance Records
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, <span className="font-semibold text-blue-600">{studentInfo.student_name}</span></p>
                <p className="text-xs sm:text-sm text-gray-500">ID: {studentInfo.student_id} • {studentInfo.department}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={goToScanner}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <QrCode className="h-4 w-4" />
                <span>Back to Scanner</span>
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

        {/* Today's Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Today's Status</p>
                <p className="text-2xl font-bold mt-2">
                  {getTodayStatus().status}
                </p>
                <p className="text-blue-100 text-xs mt-1">Current day</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Calendar className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Records</p>
                <p className="text-2xl font-bold mt-2">{attendanceRecords.length}</p>
                <p className="text-green-100 text-xs mt-1">All time</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Today's Scans</p>
                <p className="text-2xl font-bold mt-2">
                  {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                </p>
                <p className="text-purple-100 text-xs mt-1">Out of 2 possible</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Clock className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Hours Worked</p>
                <p className="text-2xl font-bold mt-2">
                  {getTodayStatus().hours.toFixed(1)}h
                </p>
                <p className="text-orange-100 text-xs mt-1">Hours today</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Attendance History</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full w-fit">
                {attendanceRecords.length} records
              </span>
            </div>
          </div>
          
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-500 mb-4">Your attendance will appear here once you start signing in/out.</p>
              <button
                onClick={goToScanner}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Go to Scanner
              </button>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block sm:hidden">
              <div className="space-y-3 p-4">
              {attendanceRecords.slice(0, 20).map((record) => (
                  <div key={record.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {record.type === "in" ? (
                      <LogIn className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 text-red-600 mr-2" />
                    )}
                        <span className="text-sm font-medium text-gray-900">
                          {record.type === "in" ? "Sign In" : "Sign Out"}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.type === 'in' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                      }`}>
                        {record.type === 'in' ? '✓ SIGN IN' : '✗ SIGN OUT'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                      <p className="font-medium">{record.time}</p>
                    </div>
                  </div>
                ))}
                {attendanceRecords.length > 20 && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Showing latest 20 records • Total: {attendanceRecords.length} records
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.slice(0, 20).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {record.type === "in" ? (
                            <LogIn className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <LogOut className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {record.type === "in" ? "Sign In" : "Sign Out"}
                          </span>
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          record.type === 'in' 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                            : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                        }`}>
                          {record.type === 'in' ? '✓ SIGN IN' : '✗ SIGN OUT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {attendanceRecords.length > 20 && (
                <div className="bg-gray-50 px-6 py-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing latest 20 records • Total: {attendanceRecords.length} records
                  </p>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
