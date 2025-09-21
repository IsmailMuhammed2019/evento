"use client";

import { useState, useEffect } from "react";
// Removed Supabase dependency - using PostgreSQL instead
import { Calendar, Clock, User, Download, Search, Filter, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">View and manage all student attendance records</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{studentSummaries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sign-ins Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.type === 'in').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Export Data</p>
                <button
                  onClick={exportToCSV}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "in" | "out")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Records</option>
                <option value="in">Sign In Only</option>
                <option value="out">Sign Out Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Summaries */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Summary</h2>
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
                      {new Date(student.last_activity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Detailed Records ({filteredRecords.length})
            </h2>
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
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.type === 'in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'in' ? 'SIGN IN' : 'SIGN OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No attendance records found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
