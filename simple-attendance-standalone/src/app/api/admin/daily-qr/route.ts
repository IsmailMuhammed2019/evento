import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Generate daily QR code
export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Check if QR code already exists for this date
    const existingQR = await pool.query(
      'SELECT * FROM daily_qr_codes WHERE date = $1',
      [date]
    );

    if (existingQR.rows.length > 0) {
      return NextResponse.json(
        { error: 'QR code already exists for this date' },
        { status: 400 }
      );
    }

    // Generate unique QR token
    const qrToken = `DAILY_${date}_${randomBytes(16).toString('hex')}`;

    // Insert new daily QR code
    const result = await pool.query(
      'INSERT INTO daily_qr_codes (date, qr_token, created_by) VALUES ($1, $2, $3) RETURNING *',
      [date, qrToken, 'admin']
    );

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Create daily QR code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all daily QR codes
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_qr_codes ORDER BY date DESC LIMIT 30'
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Get daily QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
