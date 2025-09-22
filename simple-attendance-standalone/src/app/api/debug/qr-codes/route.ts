import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Debug endpoint to check QR codes
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all QR codes
    const allQRCodes = await pool.query(
      'SELECT * FROM daily_qr_codes ORDER BY date DESC'
    );

    // Get today's QR code specifically
    const todayQRCode = await pool.query(
      'SELECT * FROM daily_qr_codes WHERE date = $1',
      [today]
    );

    return NextResponse.json({
      today: today,
      todayQRCode: todayQRCode.rows[0] || null,
      allQRCodes: allQRCodes.rows,
      totalCount: allQRCodes.rows.length
    });

  } catch (error) {
    console.error('Debug QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
