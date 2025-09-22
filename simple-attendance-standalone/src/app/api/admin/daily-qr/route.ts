import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { getNigerianDate, getNigerianTomorrow } from '@/utils/dateUtils';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

// Generate daily QR code
export async function POST(request: NextRequest) {
  try {
    const { date, forTomorrow } = await request.json();
    
    // Determine which date to use
    let targetDate: string;
    if (forTomorrow) {
      targetDate = getNigerianTomorrow();
    } else if (date) {
      targetDate = date;
    } else {
      targetDate = getNigerianDate();
    }

    // Validate that we can only generate for today or tomorrow
    const today = getNigerianDate();
    const tomorrow = getNigerianTomorrow();
    
    if (targetDate !== today && targetDate !== tomorrow) {
      return NextResponse.json(
        { error: 'QR codes can only be generated for today or tomorrow' },
        { status: 400 }
      );
    }

    // Check if QR code already exists for this date
    const existingQR = await pool.query(
      'SELECT * FROM daily_qr_codes WHERE date = $1',
      [targetDate]
    );

    if (existingQR.rows.length > 0) {
      return NextResponse.json(
        { error: `QR code already exists for ${targetDate === today ? 'today' : 'tomorrow'}` },
        { status: 400 }
      );
    }

    // Generate unique QR token
    const qrToken = `DAILY_${targetDate}_${randomBytes(16).toString('hex')}`;

    // Insert new daily QR code
    const result = await pool.query(
      'INSERT INTO daily_qr_codes (date, qr_token, created_by) VALUES ($1, $2, $3) RETURNING *',
      [targetDate, qrToken, 'admin']
    );

    return NextResponse.json({
      ...result.rows[0],
      isForTomorrow: targetDate === tomorrow
    });

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

// Delete daily QR code
export async function DELETE(request: NextRequest) {
  try {
    const { date } = await request.json();
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Delete QR code for the specified date
    const result = await pool.query(
      'DELETE FROM daily_qr_codes WHERE date = $1 RETURNING *',
      [date]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No QR code found for this date' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'QR code deleted successfully',
      deleted: result.rows[0]
    });

  } catch (error) {
    console.error('Delete daily QR code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
