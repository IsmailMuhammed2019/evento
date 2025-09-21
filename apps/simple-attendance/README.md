# Simple Attendance System

A minimal QR code-based attendance system for sign-in/sign-out tracking.

## Features

- **QR Code Scanning**: Scan student QR codes to record attendance
- **Automatic Sign-in/Sign-out**: Automatically determines if student should sign in or out
- **Real-time Updates**: Shows recent activity immediately
- **Simple Interface**: Clean, minimal design focused on core functionality

## Setup

### 1. Install Dependencies

```bash
cd apps/simple-attendance
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Create a simple `attendance` table in Supabase:

```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
```

### 4. Run the Application

```bash
npm run dev
```

## QR Code Format

Students' QR codes should contain data in this format:
```
student_id,student_name
```

Example: `2021-3439,John Doe`

## How It Works

1. **Scan QR Code**: Point camera at student's QR code
2. **Automatic Detection**: System determines if student should sign in or out based on their last record
3. **Record Attendance**: Creates a new attendance record in the database
4. **Show Feedback**: Displays success message and updates recent activity list

## Simplifications Made

- Removed complex user authentication
- Removed event management
- Removed department management
- Removed statistics and analytics
- Removed complex validation rules
- Simplified to just sign-in/sign-out functionality
- Single page application
- Minimal dependencies

## Customization

You can easily customize:
- Colors and styling in the CSS
- QR code format by modifying the parsing logic
- Database schema to add more fields
- UI layout and components
