import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

export async function GET() {
  try {
    // Get all attendance records with student names
    const result = await pool.query(
      'SELECT * FROM attendance_with_names ORDER BY created_at DESC'
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Get attendance records error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
