"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import { QrCode, Camera, CheckCircle, XCircle } from "lucide-react";
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
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
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start camera scanning
  const startScanning = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      
      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          
          // Handle video play promise properly
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Video started successfully
                detectQRCode();
              })
              .catch((error) => {
                console.log("Video play interrupted:", error);
                // This is expected when stopping/starting quickly
              });
          }
        }
      }, 100);
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    cleanup();
  };

  // QR Code detection function
  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Detect QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // QR code found
      onScanSuccess(code.data);
    } else {
      // Continue scanning
      animationRef.current = requestAnimationFrame(detectQRCode);
    }
  }, [isScanning]);

  // Start detection when video is ready
  useEffect(() => {
    if (videoRef.current && isScanning && stream) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        detectQRCode();
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [isScanning, stream, detectQRCode]);

  // Handle successful QR scan
  const onScanSuccess = async (decodedText: string) => {
    if (!studentInfo) return;

    try {
      // Stop scanning temporarily
      cleanup();

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
        setScansToday(prev => prev + 1);
        
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

      // Resume scanner after 2 seconds if not at limit
      setTimeout(() => {
        if (scansToday < 1) { // Check if we can scan again
          startScanning();
        }
      }, 2000);

    } catch (error) {
      toast.error("Error processing scan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scan failure (not used in custom implementation)
  const onScanFailure = (error: string) => {
    // This function is kept for compatibility but not used in custom implementation
    console.log("QR Code scan failed:", error);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Daily Attendance Scanner</h1>
              <p className="text-gray-600">Welcome, {studentInfo.student_name}</p>
              <p className="text-sm text-gray-500">ID: {studentInfo.student_id}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/records')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                View Records
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

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("Successfully") 
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message}
          </div>
        )}

        {/* Scanner Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              {scansToday >= 1 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="font-semibold text-gray-800">Sign In</h3>
            <p className="text-sm text-gray-600">
              {scansToday >= 1 ? "Completed" : "Not signed in"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              {scansToday >= 2 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="font-semibold text-gray-800">Sign Out</h3>
            <p className="text-sm text-gray-600">
              {scansToday >= 2 ? "Completed" : "Not signed out"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Scans Today</h3>
            <p className="text-sm text-gray-600">{scansToday}/2</p>
          </div>
        </div>

        {/* Scanner */}
        {scansToday < 2 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Scan Daily QR Code
            </h2>
            <div className="text-center">
              <div className="mb-4">
                <div className="min-h-[300px] bg-gray-100 rounded-lg flex items-center justify-center relative">
                  {!isScanning && (
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Camera scanner ready</p>
                      <button
                        onClick={startScanning}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Start Camera Scanner
                      </button>
                    </div>
                  )}
                  {isScanning && (
                    <div className="w-full h-full relative">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover rounded-lg"
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => {
                          if (videoRef.current && isScanning) {
                            detectQRCode();
                          }
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
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
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Stop
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-green-800 mb-2">Attendance Complete!</h2>
            <p className="text-green-700 mb-4">
              You have successfully signed in and out for today.
            </p>
            <button
              onClick={() => router.push('/records')}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              View Your Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
