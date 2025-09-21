import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

export async function POST(request: NextRequest) {
  try {
    const { student_id, student_name } = await request.json();

    if (!student_id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const studentResult = await pool.query(
      'SELECT student_id FROM students WHERE student_id = $1 AND is_active = true',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get today's records for this student
    const today = new Date().toISOString().split('T')[0];
    const existingRecords = await pool.query(
      'SELECT * FROM attendance WHERE student_id = $1 AND date = $2 ORDER BY time DESC',
      [student_id, today]
    );

    // Determine if this should be sign-in or sign-out
    const lastRecord = existingRecords.rows[0];
    const shouldSignIn = !lastRecord || lastRecord.type === 'out';

    // Insert new attendance record
    const currentTime = new Date().toLocaleTimeString();
    const result = await pool.query(
      'INSERT INTO attendance (student_id, date, time, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_id, today, currentTime, shouldSignIn ? 'in' : 'out']
    );

    const newRecord = result.rows[0];
    const action = shouldSignIn ? 'signed in' : 'signed out';

    return NextResponse.json({
      message: `Successfully ${action} at ${currentTime}`,
      record: newRecord,
      type: newRecord.type
    });

  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
