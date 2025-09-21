# Simple Attendance System Setup

This is a simplified version of the Evento attendance system that focuses only on basic sign-in/sign-out functionality.

## 🎯 What's Simplified

### Removed Complex Features:
- ❌ User authentication (Clerk)
- ❌ Event management system
- ❌ Department management
- ❌ Complex user roles
- ❌ Statistics and analytics
- ❌ Portal app
- ❌ Complex validation rules
- ❌ Early detection systems
- ❌ Multiple scan modes

### Kept Essential Features:
- ✅ QR code scanning
- ✅ Automatic sign-in/sign-out detection
- ✅ Simple attendance records
- ✅ Real-time feedback
- ✅ Clean, minimal interface

## 🚀 Quick Setup

### Option 1: Use the Simple Version

1. **Navigate to the simple app:**
   ```bash
   cd apps/simple-attendance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database:**
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

5. **Run the app:**
   ```bash
   npm run dev
   ```

### Option 2: Docker Deployment

1. **Use the simple Docker setup:**
   ```bash
   docker-compose -f docker-compose.simple.yml up --build -d
   ```

## 📱 How It Works

### For Administrators:
1. Open the app in a browser
2. Allow camera permissions
3. Point camera at student's QR code
4. System automatically records sign-in or sign-out
5. View recent activity in real-time

### For Students:
1. Go to `/generate` page
2. Enter student ID and name
3. Generate and download QR code
4. Print or display QR code
5. Scan QR code at attendance station

## 🔧 QR Code Format

Simple format: `student_id,student_name`
Example: `2021-3439,John Doe`

## 📊 Database Schema

Simple table structure:
```sql
attendance:
- id (auto-increment)
- student_id (text)
- student_name (text) 
- date (date)
- time (time)
- type ('in' or 'out')
- created_at (timestamp)
```

## 🎨 Features

### Main Page (`/`):
- QR code scanner
- Real-time attendance recording
- Recent activity display
- Automatic sign-in/sign-out detection

### Generate Page (`/generate`):
- Student QR code generation
- Download QR codes as images
- Simple form interface

## 🔄 Sign-in/Sign-out Logic

The system automatically determines whether a student should sign in or out:

1. **First scan of the day**: Sign IN
2. **After sign in**: Sign OUT
3. **After sign out**: Sign IN (for next session)

## 🚀 Deployment

### Development:
```bash
cd apps/simple-attendance
npm run dev
```

### Production with Docker:
```bash
docker-compose -f docker-compose.simple.yml up --build -d
```

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 Customization

You can easily customize:

1. **Styling**: Modify `globals.css` and Tailwind classes
2. **QR Format**: Change the parsing logic in `page.tsx`
3. **Database**: Add more fields to the attendance table
4. **UI**: Modify components and layout
5. **Validation**: Add custom validation rules

## 🔍 Troubleshooting

### Common Issues:

1. **Camera not working**: Ensure HTTPS in production
2. **QR codes not scanning**: Check QR code format matches expected pattern
3. **Database errors**: Verify Supabase connection and table structure
4. **Build errors**: Check all dependencies are installed

### Debug Mode:
```bash
DEBUG=* npm run dev
```

## 📈 Scaling

For larger deployments:
1. Use a load balancer
2. Set up database connection pooling
3. Add caching for frequently accessed data
4. Implement proper logging and monitoring

This simplified version gives you a clean, minimal attendance system that's easy to understand, deploy, and maintain!
