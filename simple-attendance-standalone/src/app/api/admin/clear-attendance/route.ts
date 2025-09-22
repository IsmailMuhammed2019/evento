import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

export async function DELETE() {
  try {
    // Clear all data in the correct order (respecting foreign key constraints)
    const results = {
      qrCodes: { deletedCount: 0, records: [] as any[] },
      attendance: { deletedCount: 0, records: [] as any[] },
      students: { deletedCount: 0, records: [] as any[] }
    };

    // 1. Clear all daily QR codes
    const qrResult = await pool.query('DELETE FROM daily_qr_codes RETURNING *');
    results.qrCodes.deletedCount = qrResult.rows.length;
    results.qrCodes.records = qrResult.rows;

    // 2. Clear all attendance records
    const attendanceResult = await pool.query('DELETE FROM attendance RETURNING *');
    results.attendance.deletedCount = attendanceResult.rows.length;
    results.attendance.records = attendanceResult.rows;

    // 3. Clear all students
    const studentsResult = await pool.query('DELETE FROM students RETURNING *');
    results.students.deletedCount = studentsResult.rows.length;
    results.students.records = studentsResult.rows;

    const totalDeleted = results.qrCodes.deletedCount + results.attendance.deletedCount + results.students.deletedCount;
    
    return NextResponse.json({
      message: 'All data cleared successfully',
      totalDeleted,
      details: results
    });

  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Clear all data in the correct order (respecting foreign key constraints)
    const results = {
      qrCodes: { deletedCount: 0, records: [] as any[] },
      attendance: { deletedCount: 0, records: [] as any[] },
      students: { deletedCount: 0, records: [] as any[] }
    };

    // 1. Clear all daily QR codes
    const qrResult = await pool.query('DELETE FROM daily_qr_codes RETURNING *');
    results.qrCodes.deletedCount = qrResult.rows.length;
    results.qrCodes.records = qrResult.rows;

    // 2. Clear all attendance records
    const attendanceResult = await pool.query('DELETE FROM attendance RETURNING *');
    results.attendance.deletedCount = attendanceResult.rows.length;
    results.attendance.records = attendanceResult.rows;

    // 3. Clear all students
    const studentsResult = await pool.query('DELETE FROM students RETURNING *');
    results.students.deletedCount = studentsResult.rows.length;
    results.students.records = studentsResult.rows;

    const totalDeleted = results.qrCodes.deletedCount + results.attendance.deletedCount + results.students.deletedCount;
    
    return NextResponse.json({
      message: 'All data cleared successfully',
      totalDeleted,
      details: results
    });

  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
