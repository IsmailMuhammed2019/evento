import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://attendance_user:attendance_password@localhost:5432/attendance_db',
});

export async function POST(request: NextRequest) {
  try {
    const { student_id, student_name } = await request.json();

    if (!student_id || !student_name) {
      return NextResponse.json(
        { error: 'Student ID and Name are required' },
        { status: 400 }
      );
    }

    try {
      // Check if student already exists
      const existingResult = await pool.query(
        'SELECT student_id, first_name, last_name, email, department FROM students WHERE student_id = $1',
        [student_id]
      );

      if (existingResult.rows.length > 0) {
        // Student exists, return their info
        const student = existingResult.rows[0];
        const fullName = `${student.first_name} ${student.last_name}`;
        
        return NextResponse.json({
          student_id: student.student_id,
          student_name: fullName,
          email: student.email,
          department: student.department,
        });
      } else {
        // Student doesn't exist, create new record
        const nameParts = student_name.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Student';
        
        // Create new student record
        const insertResult = await pool.query(
          'INSERT INTO students (student_id, first_name, last_name, email, department, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [
            student_id,
            firstName,
            lastName,
            `${student_id.toLowerCase().replace('-', '.')}@university.edu`,
            'General Studies',
            true
          ]
        );

        const newStudent = insertResult.rows[0];
        console.log(`New student created: ${student_id} - ${student_name}`);
        
        return NextResponse.json({
          student_id: newStudent.student_id,
          student_name: `${newStudent.first_name} ${newStudent.last_name}`,
          email: newStudent.email,
          department: newStudent.department,
        });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
