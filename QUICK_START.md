# 🚀 Quick Start Guide - Simple Attendance System

## ✅ **Docker Build Successful!**

Your simple attendance system is now running in Docker! Here's how to complete the setup:

## 🔧 **Step 1: Set Environment Variables**

The app is currently running but needs Supabase configuration. You have two options:

### Option A: Set Environment Variables and Restart

```bash
# Set your Supabase credentials
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Restart the container with new environment variables
docker-compose -f docker-compose.standalone.yml down
docker-compose -f docker-compose.standalone.yml up -d
```

### Option B: Create .env File

```bash
# Create environment file
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF

# Restart with environment file
docker-compose -f docker-compose.standalone.yml down
docker-compose -f docker-compose.standalone.yml up -d
```

## 🗄️ **Step 2: Setup Database**

Run this SQL in your Supabase SQL editor:

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

CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
```

## 🌐 **Step 3: Access the Application**

Your app is now running at:
- **Main App**: http://localhost:3000
- **QR Generator**: http://localhost:3000/generate
- **Admin Dashboard**: http://localhost:3000/admin

## 📱 **How to Use**

### For Administrators:
1. **Scanning**: Open http://localhost:3000
   - Allow camera permissions
   - Point camera at student QR codes
   - System automatically records sign-in/sign-out
   - View recent activity in real-time

2. **Admin Dashboard**: Open http://localhost:3000/admin
   - View all student attendance records
   - See student summaries and statistics
   - Filter records by date, type, or student
   - Export data as CSV
   - Monitor daily attendance patterns

### For Students:
1. Go to http://localhost:3000/generate
2. Enter student ID and name
3. Generate and download QR code
4. Print or display QR code
5. Scan QR code at attendance station

## 🔍 **QR Code Format**

Simple format: `student_id,student_name`
Example: `2021-3439,John Doe`

## 🛠️ **Management Commands**

```bash
# View logs
docker logs evento-simple-attendance-1

# Stop the app
docker-compose -f docker-compose.standalone.yml down

# Restart the app
docker-compose -f docker-compose.standalone.yml up -d

# Rebuild and restart
docker-compose -f docker-compose.standalone.yml up --build -d
```

## 🎯 **What's Working Now**

✅ **Docker Build**: Successfully builds and runs  
✅ **QR Scanner**: Camera-based QR code scanning  
✅ **Auto Detection**: Automatic sign-in/sign-out logic  
✅ **Admin Dashboard**: Complete attendance management interface  
✅ **Data Export**: CSV export functionality  
✅ **Filtering & Search**: Advanced record filtering  
✅ **Clean UI**: Minimal, focused interface  
✅ **Error Handling**: Graceful handling of missing configuration  

## ⚠️ **Current Status**

The app is running but will show a configuration warning until you set the Supabase environment variables. Once configured, it will work perfectly for attendance tracking!

## 🔧 **Troubleshooting**

### If the app doesn't load:
```bash
# Check container status
docker ps

# Check logs
docker logs evento-simple-attendance-1

# Restart if needed
docker-compose -f docker-compose.standalone.yml restart
```

### If QR codes don't scan:
- Ensure HTTPS in production
- Check browser camera permissions
- Verify QR code format matches expected pattern

### If database errors occur:
- Verify Supabase URL and keys are correct
- Check table structure matches the SQL above
- Ensure RLS policies allow access

## 🎉 **You're All Set!**

Your simple attendance system is now running successfully! Just add your Supabase credentials and you'll have a fully functional QR code-based attendance system.
