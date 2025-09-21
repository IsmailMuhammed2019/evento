# Simple Attendance System (Standalone)

A minimal, standalone QR code-based attendance system for sign-in/sign-out tracking.

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy the example environment file:
```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

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

### 4. Run the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Set your environment variables first
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Build and run
docker-compose -f ../docker-compose.standalone.yml up --build -d
```

### Manual Docker Build

```bash
# Build the image
docker build -t simple-attendance .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  simple-attendance
```

## 📱 Features

### Main Page (`/`)
- **QR Code Scanner**: Point camera at student QR codes
- **Automatic Detection**: Determines sign-in vs sign-out automatically
- **Real-time Updates**: Shows recent activity immediately
- **Clean Interface**: Minimal, focused design

### Generate Page (`/generate`)
- **QR Code Generation**: Create student QR codes
- **Download**: Save QR codes as images
- **Simple Form**: Easy student data entry

## 🔧 How It Works

### QR Code Format
```
student_id,student_name
```
Example: `2021-3439,John Doe`

### Sign-in/Sign-out Logic
1. **First scan of the day**: Sign IN
2. **After sign in**: Sign OUT
3. **After sign out**: Sign IN (for next session)

### Database Schema
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

## 🎨 Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update Tailwind classes in components
- Change colors in `tailwind.config.js`

### QR Code Format
- Update parsing logic in `src/app/page.tsx`
- Modify generation logic in `src/app/generate/page.tsx`

### Database
- Add more fields to the attendance table
- Create additional tables as needed
- Modify queries in the components

## 🔍 Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS in production
   - Check browser permissions
   - Try different browsers

2. **QR codes not scanning**
   - Verify QR code format matches expected pattern
   - Check QR code quality and size
   - Ensure good lighting

3. **Database connection errors**
   - Verify Supabase URL and keys
   - Check table structure matches schema
   - Ensure RLS policies allow access

4. **Build errors**
   - Run `npm install` to ensure all dependencies
   - Check Node.js version (18+ recommended)
   - Clear `.next` folder and rebuild

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 📊 Monitoring

### Logs
- Application logs in browser console
- Docker logs: `docker logs container_name`
- Supabase logs in dashboard

### Health Checks
- Main app: `http://localhost:3000`
- Generate page: `http://localhost:3000/generate`

## 🔒 Security

### Production Considerations
- Use HTTPS in production
- Set up proper CORS policies
- Implement rate limiting
- Regular security updates
- Monitor access logs

### Environment Variables
- Never commit `.env.local` to version control
- Use strong, unique Supabase keys
- Rotate keys regularly

## 📈 Scaling

### Performance
- Add database indexes for large datasets
- Implement caching for frequently accessed data
- Use CDN for static assets
- Monitor database performance

### Deployment
- Use load balancers for multiple instances
- Set up database connection pooling
- Implement proper logging and monitoring
- Use container orchestration (Kubernetes, Docker Swarm)

This standalone version is completely independent and doesn't require the monorepo structure!
