-- Initialize the attendance database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily QR Codes table
CREATE TABLE IF NOT EXISTS daily_qr_codes (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    qr_token VARCHAR(100) NOT NULL UNIQUE,
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Attendance table (updated for daily QR system)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    qr_token VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (qr_token) REFERENCES daily_qr_codes(qr_token) ON DELETE CASCADE,
    UNIQUE(student_id, date, type) -- Prevents duplicate in/out for same day
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_qr_token ON attendance(qr_token);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_qr_codes_date ON daily_qr_codes(date);
CREATE INDEX IF NOT EXISTS idx_daily_qr_codes_token ON daily_qr_codes(qr_token);

-- Insert some sample students with APP-2025-XXXXX format
INSERT INTO students (student_id, first_name, last_name, email, department) VALUES
('APP-2025-97698', 'Ismail', 'Muhammed', 'ismail.muhammed@university.edu', 'Computer Science'),
('APP-2025-12345', 'Aisha', 'Hassan', 'aisha.hassan@university.edu', 'Mathematics'),
('APP-2025-23456', 'Omar', 'Ali', 'omar.ali@university.edu', 'Physics'),
('APP-2025-34567', 'Fatima', 'Ibrahim', 'fatima.ibrahim@university.edu', 'Chemistry'),
('APP-2025-45678', 'Ahmed', 'Yusuf', 'ahmed.yusuf@university.edu', 'Biology'),
('APP-2025-56789', 'Khadija', 'Abdullah', 'khadija.abdullah@university.edu', 'Engineering'),
('APP-2025-67890', 'Hassan', 'Mohammed', 'hassan.mohammed@university.edu', 'Medicine'),
('APP-2025-78901', 'Aminah', 'Suleiman', 'aminah.suleiman@university.edu', 'Law')
ON CONFLICT (student_id) DO NOTHING;

-- Create a function to get student full name
CREATE OR REPLACE FUNCTION get_student_full_name(student_id_param VARCHAR(50))
RETURNS VARCHAR(200) AS $$
BEGIN
    RETURN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE student_id = student_id_param);
END;
$$ LANGUAGE plpgsql;

-- Create a view for attendance with student names and QR info
CREATE OR REPLACE VIEW attendance_with_names AS
SELECT 
    a.id,
    a.student_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    a.date,
    a.time,
    a.type,
    a.qr_token,
    a.created_at,
    s.department
FROM attendance a
JOIN students s ON a.student_id = s.student_id
ORDER BY a.created_at DESC;

-- Create a view for daily attendance summary
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT 
    a.date,
    a.student_id,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.department,
    MAX(CASE WHEN a.type = 'in' THEN a.time END) as sign_in_time,
    MAX(CASE WHEN a.type = 'out' THEN a.time END) as sign_out_time,
    CASE 
        WHEN MAX(CASE WHEN a.type = 'in' THEN 1 ELSE 0 END) = 1 
         AND MAX(CASE WHEN a.type = 'out' THEN 1 ELSE 0 END) = 1 
        THEN 'Complete'
        WHEN MAX(CASE WHEN a.type = 'in' THEN 1 ELSE 0 END) = 1 
        THEN 'Signed In Only'
        ELSE 'Not Signed In'
    END as attendance_status
FROM attendance a
JOIN students s ON a.student_id = s.student_id
GROUP BY a.date, a.student_id, s.first_name, s.last_name, s.department
ORDER BY a.date DESC, a.student_id;
