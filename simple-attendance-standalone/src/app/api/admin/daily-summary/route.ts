import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Get daily attendance summary
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_attendance_summary ORDER BY date DESC, student_id'
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Get daily summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
