"use client";

import { useState, useEffect } from "react";
// Removed Supabase dependency - using PostgreSQL instead
import { Calendar, Clock, User, Download, Search, Filter, CheckCircle, XCircle, AlertCircle, BarChart3, Users, Activity, TrendingUp, Eye, Settings, LogOut, Trash2, Database } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// PostgreSQL setup - using API routes instead of direct database access

interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  date: string;
  time: string;
  type: "in" | "out";
  qr_token: string;
  created_at: string;
  department: string;
}

interface DailyAttendanceSummary {
  date: string;
  student_id: string;
  student_name: string;
  department: string;
  sign_in_time: string;
  sign_out_time: string;
  attendance_status: "Complete" | "Signed In Only" | "Not Signed In";
}

interface StudentSummary {
  student_id: string;
  student_name: string;
  total_days: number;
  last_activity: string;
  status: "active" | "inactive";
}

export default function AdminDashboard() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Complete" | "Signed In Only" | "Not Signed In">("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"detailed" | "summary">("summary");
  const [dailySummary, setDailySummary] = useState<DailyAttendanceSummary[]>([]);
  const router = useRouter();


  // Load all attendance records
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      try {
        const [attendanceResponse, summaryResponse] = await Promise.all([
          fetch('/api/admin/attendance'),
          fetch('/api/admin/daily-summary')
        ]);

        if (attendanceResponse.ok) {
          const data = await attendanceResponse.json();
          setAttendanceRecords(data);
          generateStudentSummaries(data);
        }

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setDailySummary(summaryData);
        }
      } catch (error) {
        console.error("Error loading attendance records:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceRecords();
  }, []);

  // Generate student summaries
  const generateStudentSummaries = (records: AttendanceRecord[]) => {
    const studentMap = new Map<string, StudentSummary>();

    records.forEach(record => {
      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          student_id: record.student_id,
          student_name: record.student_name,
          total_days: 0,
          last_activity: record.created_at,
          status: "active"
        });
      }

      const summary = studentMap.get(record.student_id)!;
      summary.total_days = new Set(
        records
          .filter(r => r.student_id === record.student_id)
          .map(r => r.date)
      ).size;
      summary.last_activity = record.created_at;
    });

    setStudentSummaries(Array.from(studentMap.values()));
  };

  // Filter records based on search and filters
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || record.date === dateFilter;
    const matchesType = typeFilter === "all" || record.type === typeFilter;

    return matchesSearch && matchesDate && matchesType;
  });

  // Export data as CSV
  const exportToCSV = () => {
    const headers = ["Student ID", "Student Name", "Date", "Time", "Type", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map(record => [
        record.student_id,
        `"${record.student_name}"`,
        record.date,
        record.time,
        record.type,
        record.created_at
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminInfo');
    router.push('/admin/login');
  };

  // Handle clear database
  const handleClearDatabase = async () => {
    if (!confirm("⚠️ WARNING: This will delete ALL data permanently!\n\n• All QR codes\n• All attendance records\n• All student data\n\nThis action cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    if (!confirm("🚨 FINAL CONFIRMATION: You are about to delete ALL data.\n\nThis includes:\n• All generated QR codes\n• All attendance records\n• All student information\n\nType 'DELETE ALL' to confirm:")) {
      return;
    }

    try {
      const response = await fetch('/api/admin/clear-attendance', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Database cleared successfully!\n\nDeleted:\n• ${data.details.qrCodes.deletedCount} QR codes\n• ${data.details.attendance.deletedCount} attendance records\n• ${data.details.students.deletedCount} students\n\nTotal: ${data.totalDeleted} records deleted.`);
        
        // Reload the page to refresh data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Error clearing database: ${error.error}`);
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('❌ Error clearing database. Please try again.');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading attendance records...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Manage student attendance with ease</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/daily-qr"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Settings className="h-4 w-4" />
                <span>QR Codes</span>
              </Link>
              <button
                onClick={handleClearDatabase}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Data</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold mt-2">{studentSummaries.length}</p>
                <p className="text-blue-100 text-xs mt-1">Active users</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Records</p>
                <p className="text-3xl font-bold mt-2">{attendanceRecords.length}</p>
                <p className="text-green-100 text-xs mt-1">All time</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Activity className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Sign-ins Today</p>
                <p className="text-3xl font-bold mt-2">
                  {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.type === 'in').length}
                </p>
                <p className="text-purple-100 text-xs mt-1">Current day</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Export Data</p>
                <button
                  onClick={exportToCSV}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium mt-2 transition-all duration-200"
                >
                  Download CSV
                </button>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Download className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter by Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "in" | "out")}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              >
                <option value="all">All Records</option>
                <option value="in">Sign In Only</option>
                <option value="out">Sign Out Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Summaries */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Student Summary</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentSummaries.map((student) => (
                  <tr key={student.student_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.total_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                      }`}>
                        {student.status === 'active' ? '✓ Active' : '○ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Records */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Daily Attendance Summary
            </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {filteredRecords.length} records
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sign In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sign Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Group records by student and date
                  const groupedRecords = filteredRecords.reduce((acc, record) => {
                    const key = `${record.student_id}-${record.date}`;
                    if (!acc[key]) {
                      acc[key] = {
                        student_name: record.student_name,
                        student_id: record.student_id,
                        date: record.date,
                        signIn: null,
                        signOut: null
                      };
                    }
                    if (record.type === 'in') {
                      acc[key].signIn = record;
                    } else {
                      acc[key].signOut = record;
                    }
                    return acc;
                  }, {} as any);

                  return Object.values(groupedRecords).map((group: any, index) => (
                    <tr key={`${group.student_id}-${group.date}`} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                            {group.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {group.student_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.date ? new Date(group.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.signIn ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-green-800 font-medium">{group.signIn.time}</span>
                      </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.signOut ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-red-800 font-medium">{group.signOut.time}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.signIn && group.signOut ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-medium">
                              {(() => {
                                try {
                                  const signInTime = new Date(`${group.date}T${group.signIn.time}`);
                                  const signOutTime = new Date(`${group.date}T${group.signOut.time}`);
                                  if (isNaN(signInTime.getTime()) || isNaN(signOutTime.getTime())) {
                                    return 'N/A';
                                  }
                                  const hoursWorked = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
                                  return `${hoursWorked.toFixed(1)}h`;
                                } catch (error) {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          (() => {
                            if (group.signIn && group.signOut) {
                              try {
                                const signInTime = new Date(`${group.date}T${group.signIn.time}`);
                                const signOutTime = new Date(`${group.date}T${group.signOut.time}`);
                                if (isNaN(signInTime.getTime()) || isNaN(signOutTime.getTime())) {
                                  return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200';
                                }
                                const hoursWorked = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
                                return hoursWorked >= 7 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                  : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
                              } catch (error) {
                                return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200';
                              }
                            } else if (group.signIn) {
                              return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200';
                            } else {
                              return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
                            }
                          })()
                        }`}>
                          {(() => {
                            if (group.signIn && group.signOut) {
                              try {
                                const signInTime = new Date(`${group.date}T${group.signIn.time}`);
                                const signOutTime = new Date(`${group.date}T${group.signOut.time}`);
                                if (isNaN(signInTime.getTime()) || isNaN(signOutTime.getTime())) {
                                  return '⚠ Partial';
                                }
                                const hoursWorked = (signOutTime.getTime() - signInTime.getTime()) / (1000 * 60 * 60);
                                return hoursWorked >= 7 ? '✓ Present' : '✗ Absent';
                              } catch (error) {
                                return '⚠ Partial';
                              }
                            } else if (group.signIn) {
                              return '⚠ Partial';
                            } else {
                              return '✗ Absent';
                            }
                          })()}
                      </span>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500 mb-4">No attendance records match your current search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
                setTypeFilter("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
