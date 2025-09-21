"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function GenerateQR() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const generateQR = async () => {
    if (!studentId || !studentName) {
      alert("Please fill in both Student ID and Name");
      return;
    }

    const qrData = `${studentId},${studentName}`;
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${studentId}-${studentName}-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Generate Student QR Code
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., 2021-3439"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={generateQR}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate QR Code
            </button>
          </div>

          {qrCodeUrl && (
            <div className="mt-8 text-center">
              <div className="mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto border rounded-lg" />
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">QR Code Data:</p>
                <p className="font-mono text-sm">{studentId},{studentName}</p>
              </div>

              <button
                onClick={downloadQR}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Enter the student's ID and name</li>
            <li>2. Click "Generate QR Code"</li>
            <li>3. Download the QR code image</li>
            <li>4. Print or display the QR code for the student</li>
            <li>5. Students can scan this QR code at the attendance station</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
