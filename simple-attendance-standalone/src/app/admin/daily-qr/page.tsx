"use client";

import { useState, useEffect } from "react";
import { QrCode, Calendar, Clock, Download, RefreshCw } from "lucide-react";
import QRCode from "qrcode";

interface DailyQRCode {
  id: number;
  date: string;
  qr_token: string;
  created_at: string;
  is_active: boolean;
}

export default function DailyQRPage() {
  const [todayQR, setTodayQR] = useState<DailyQRCode | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  // Load today's QR code
  useEffect(() => {
    loadTodayQR();
  }, []);

  const loadTodayQR = async () => {
    try {
      const response = await fetch('/api/admin/daily-qr/today');
      if (response.ok) {
        const data = await response.json();
        setTodayQR(data);
        if (data) {
          generateQRCode(data.qr_token);
        }
      }
    } catch (error) {
      console.error("Error loading today's QR code:", error);
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

  const createTodayQR = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch('/api/admin/daily-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodayQR(data);
        await generateQRCode(data.qr_token);
        setMessage("Daily QR code created successfully!");
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
      const link = document.createElement('a');
      link.download = `daily-qr-${new Date().toISOString().split('T')[0]}.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
  };

  const refreshQR = () => {
    if (todayQR) {
      generateQRCode(todayQR.qr_token);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Daily QR Code Generator</h1>
              <p className="text-gray-600">Generate and manage daily QR codes for student attendance</p>
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
                Today's QR Code
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
              </div>
            </div>

            {todayQR ? (
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
                  <p><strong>Date:</strong> {new Date(todayQR.date).toLocaleDateString()}</p>
                  <p><strong>Token:</strong> {todayQR.qr_token}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      todayQR.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {todayQR.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No QR code generated for today</p>
                <button
                  onClick={createTodayQR}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Generate Today's QR Code"}
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
                  <p className="font-medium">Generate Daily QR Code</p>
                  <p className="text-gray-600">Click "Generate Today's QR Code" to create a new QR code for today</p>
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
                  <p className="text-gray-600">Students login and scan the QR code to record their attendance</p>
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
                <li>• QR codes are unique for each day</li>
                <li>• Students must login with their Student ID before scanning</li>
                <li>• Download QR code to display on screens or print for students</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
