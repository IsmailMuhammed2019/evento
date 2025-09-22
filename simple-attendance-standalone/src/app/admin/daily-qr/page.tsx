"use client";

import { useState, useEffect } from "react";
import { QrCode, Calendar, Clock, Download, RefreshCw, Trash2, Plus } from "lucide-react";
import QRCode from "qrcode";
import { getNigerianDate, getNigerianTomorrow, formatNigerianDate } from "@/utils/dateUtils";

interface DailyQRCode {
  id: number;
  date: string;
  qr_token: string;
  created_at: string;
  is_active: boolean;
  isForTomorrow?: boolean;
}

export default function DailyQRPage() {
  const [todayQR, setTodayQR] = useState<DailyQRCode | null>(null);
  const [tomorrowQR, setTomorrowQR] = useState<DailyQRCode | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentView, setCurrentView] = useState<'today' | 'tomorrow'>('today');


  // Load QR codes
  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      // Load today's QR code
      const todayResponse = await fetch('/api/admin/daily-qr/today');
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayQR(todayData);
        if (todayData && currentView === 'today') {
          generateQRCode(todayData.qr_token);
        }
      }

      // Load tomorrow's QR code
      const tomorrowResponse = await fetch(`/api/admin/daily-qr/today?date=${getNigerianTomorrow()}`);
      if (tomorrowResponse.ok) {
        const tomorrowData = await tomorrowResponse.json();
        setTomorrowQR(tomorrowData);
        if (tomorrowData && currentView === 'tomorrow') {
          generateQRCode(tomorrowData.qr_token);
        }
      }
    } catch (error) {
      console.error("Error loading QR codes:", error);
    }
  };

  const generateQRCode = async (token: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const createQR = async (forTomorrow: boolean = false) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/admin/daily-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forTomorrow }),
      });

      if (response.ok) {
        const data = await response.json();
        if (forTomorrow) {
          setTomorrowQR(data);
        } else {
          setTodayQR(data);
        }
        await generateQRCode(data.qr_token);
        setMessage(`QR code created successfully for ${forTomorrow ? 'tomorrow' : 'today'}!`);
      } else {
        const error = await response.json();
        setMessage(error.error || "Failed to create QR code");
      }
    } catch (error) {
      setMessage("Error creating QR code");
    }

    setLoading(false);
  };

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const currentQR = currentView === 'today' ? todayQR : tomorrowQR;
      const dateStr = currentQR?.date || getNigerianDate();
      const link = document.createElement('a');
      link.download = `daily-qr-${dateStr}.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const refreshQR = () => {
    const currentQR = currentView === 'today' ? todayQR : tomorrowQR;
    if (currentQR) {
      generateQRCode(currentQR.qr_token);
    }
  };

  const switchView = (view: 'today' | 'tomorrow') => {
    setCurrentView(view);
    const targetQR = view === 'today' ? todayQR : tomorrowQR;
    if (targetQR) {
      generateQRCode(targetQR.qr_token);
    } else {
      setQrCodeDataURL("");
    }
  };

  const clearQR = async () => {
    const currentQR = currentView === 'today' ? todayQR : tomorrowQR;
    if (!currentQR) return;
    
    const dayType = currentView === 'today' ? 'today' : 'tomorrow';
    if (!confirm(`Are you sure you want to clear ${dayType}'s QR code? This will make it invalid for students.`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/admin/daily-qr', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: currentQR.date }),
      });

      if (response.ok) {
        if (currentView === 'today') {
          setTodayQR(null);
        } else {
          setTomorrowQR(null);
        }
        setQrCodeDataURL("");
        setMessage(`${dayType.charAt(0).toUpperCase() + dayType.slice(1)}'s QR code cleared successfully!`);
      } else {
        const error = await response.json();
        setMessage(error.error || "Failed to clear QR code");
      }
    } catch (error) {
      setMessage("Error clearing QR code");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Daily QR Code Generator</h1>
              <p className="text-gray-600">Generate and manage daily QR codes for student attendance (Nigerian Timezone)</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => switchView('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => switchView('tomorrow')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'tomorrow'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("successfully") 
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                {currentView === 'today' ? "Today's QR Code" : "Tomorrow's QR Code"}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={refreshQR}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Refresh QR Code"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={downloadQRCode}
                  disabled={!qrCodeDataURL}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Download QR Code"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={clearQR}
                  disabled={loading}
                  className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                  title="Clear QR Code"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(currentView === 'today' ? todayQR : tomorrowQR) ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  {qrCodeDataURL ? (
                    <img 
                      src={qrCodeDataURL} 
                      alt="Daily QR Code" 
                      className="mx-auto"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Generating QR Code...</p>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Date:</strong> {(currentView === 'today' ? todayQR : tomorrowQR)!.date ? formatNigerianDate((currentView === 'today' ? todayQR : tomorrowQR)!.date) : 'N/A'}</p>
                  <p><strong>Token:</strong> {(currentView === 'today' ? todayQR : tomorrowQR)!.qr_token}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      (currentView === 'today' ? todayQR : tomorrowQR)!.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {(currentView === 'today' ? todayQR : tomorrowQR)!.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No QR code generated for {currentView}</p>
                <button
                  onClick={() => createQR(currentView === 'tomorrow')}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Creating..." : `Generate ${currentView === 'today' ? "Today's" : "Tomorrow's"} QR Code`}
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Instructions
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                <div>
                  <p className="font-medium">Generate QR Codes</p>
                  <p className="text-gray-600">Generate QR codes for today or tomorrow. Use tomorrow's code to prepare for the next day.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                <div>
                  <p className="font-medium">Display QR Code</p>
                  <p className="text-gray-600">Display the QR code on a screen or print it for students to scan</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                <div>
                  <p className="font-medium">Students Scan</p>
                  <p className="text-gray-600">Students login and scan the QR code to record their attendance (Nigerian timezone)</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
                <div>
                  <p className="font-medium">Monitor Attendance</p>
                  <p className="text-gray-600">Use the Admin Dashboard to view and manage daily attendance records</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Each student can scan maximum 2 times per day (Sign In + Sign Out)</li>
                <li>• QR codes are unique for each day and work in Nigerian timezone</li>
                <li>• Students must login with their Student ID before scanning</li>
                <li>• Generate tomorrow's QR code in advance to prepare for the next day</li>
                <li>• Download QR code to display on screens or print for students</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
