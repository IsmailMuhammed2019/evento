import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getNigerianDate, getNigerianTime, isTodayOrTomorrowInNigeria } from '@/utils/dateUtils';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Student scans daily QR code
export async function POST(request: NextRequest) {
  try {
    const { student_id, qr_token } = await request.json();

    if (!student_id || !qr_token) {
      return NextResponse.json(
        { error: 'Student ID and QR token are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentResult = await pool.query(
      'SELECT student_id, first_name, last_name FROM students WHERE student_id = $1 AND is_active = true',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = studentResult.rows[0];

    // Verify QR token is valid and active
    const qrResult = await pool.query(
      'SELECT * FROM daily_qr_codes WHERE qr_token = $1 AND is_active = true',
      [qr_token]
    );

    if (qrResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 400 }
      );
    }

    const qrCode = qrResult.rows[0];
    const today = getNigerianDate();
    
    // Convert QR code date to same format for comparison
    const qrDate = new Date(qrCode.date).toISOString().split('T')[0];

    // Debug logging
    console.log('QR Code Date (original):', qrCode.date);
    console.log('QR Code Date (formatted):', qrDate);
    console.log('Today Date (Nigeria):', today);
    console.log('QR Token:', qr_token);

    // Check if QR code is for today or tomorrow (allow next day codes)
    if (!isTodayOrTomorrowInNigeria(qrDate)) {
      return NextResponse.json(
        { 
          error: 'QR code is not valid for today or tomorrow',
          debug: {
            qrDate: qrCode.date,
            qrDateFormatted: qrDate,
            todayDate: today,
            qrToken: qr_token
          }
        },
        { status: 400 }
      );
    }

    // Check existing attendance records for today
    const existingRecords = await pool.query(
      'SELECT * FROM attendance WHERE student_id = $1 AND date = $2 ORDER BY time DESC',
      [student_id, today]
    );

    // Determine what type of scan this should be
    let scanType: 'in' | 'out';
    let message: string;

    if (existingRecords.rows.length === 0) {
      // First scan - Sign In
      scanType = 'in';
      message = 'Successfully signed in';
    } else if (existingRecords.rows.length === 1) {
      // Second scan - Sign Out
      scanType = 'out';
      message = 'Successfully signed out';
    } else {
      // Already signed in and out - no more scans allowed
      return NextResponse.json(
        { error: 'You have already signed in and out today. Maximum 2 scans per day allowed.' },
        { status: 400 }
      );
    }

    // Record the attendance
    const currentTime = getNigerianTime();
    const result = await pool.query(
      'INSERT INTO attendance (student_id, date, time, type, qr_token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, today, currentTime, scanType, qr_token]
    );

    const newRecord = result.rows[0];

    return NextResponse.json({
      message: `${message} at ${currentTime}`,
      record: newRecord,
      type: scanType,
      student_name: `${student.first_name} ${student.last_name}`,
      remaining_scans: scanType === 'in' ? 1 : 0
    });

  } catch (error) {
    console.error('Scan daily QR error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
