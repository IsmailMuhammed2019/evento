import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Get today's QR code
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'SELECT * FROM daily_qr_codes WHERE date = $1 AND is_active = true',
      [today]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Get today QR code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
