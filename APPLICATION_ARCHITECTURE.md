# 🏗️ Evento Attendance System - Application Architecture

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTO ATTENDANCE SYSTEM                    │
│                     (Simple Version)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STUDENT       │    │     ADMIN       │    │   DATABASE      │
│   PORTAL        │    │    PORTAL       │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • Login (App ID │    │ • Login (User/  │    │ • Students      │
│   + Name)       │    │   Pass)         │    │ • Attendance    │
│ • QR Scanner    │    │ • Daily QR Gen  │    │ • Daily QR      │
│ • Records View  │    │ • Dashboard     │    │ • Sessions      │
│ • Direct Sign   │    │ • Export Data   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 User Flow Diagrams

### Student Flow:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Landing   │───▶│   Scanner   │───▶│   Records   │───▶│   Logout    │
│   Page      │    │   Page      │    │   Page      │    │             │
│             │    │             │    │             │    │             │
│ App ID +    │    │ Scan QR or  │    │ View        │    │ Clear       │
│ Name Login  │    │ Direct Sign │    │ History     │    │ Session     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Admin Flow:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Admin Login │───▶│ Daily QR    │───▶│ Dashboard   │───▶│ Export/     │
│             │    │ Generator   │    │             │    │ Manage      │
│             │    │             │    │             │    │             │
│ User/Pass   │    │ Generate &  │    │ View All    │    │ CSV Export  │
│ Auth        │    │ Display QR  │    │ Records     │    │ & Analytics │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🗂️ File Structure

```
simple-attendance-standalone/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page (Student login)
│   │   ├── student/
│   │   │   └── page.tsx            # Student portal dashboard
│   │   ├── scanner/
│   │   │   └── page.tsx            # QR code scanner
│   │   ├── records/
│   │   │   └── page.tsx            # Student attendance records
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Admin login page
│   │   │   ├── page.tsx            # Admin dashboard
│   │   │   └── daily-qr/
│   │   │       └── page.tsx        # Daily QR generator
│   │   └── api/
│   │       ├── student/
│   │       │   ├── login/          # Student authentication
│   │       │   ├── attendance/     # Attendance recording
│   │       │   └── scan-daily-qr/  # QR code scanning
│   │       └── admin/
│   │           ├── login/          # Admin authentication
│   │           ├── attendance/     # Get all records
│   │           └── daily-summary/  # Daily statistics
│   └── components/
│       └── Navigation.tsx          # Navigation component
```

## 🔐 Authentication Flow

### Student Authentication:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Enter App   │───▶│ Check DB    │───▶│ Create/Find │
│ ID + Name   │    │ for Student │    │ Student     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Student     │    │ Store in    │
                   │ Exists      │    │ localStorage│
                   └─────────────┘    └─────────────┘
```

### Admin Authentication:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Enter User/ │───▶│ Validate    │───▶│ Store Admin │
│ Password    │    │ Credentials │    │ Session     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 📱 Attendance Recording Flow

### QR Code Scanning:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Student     │───▶│ Scan Daily  │───▶│ Validate QR │
│ Opens       │    │ QR Code     │    │ Code        │
│ Scanner     │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Check Today │    │ Record      │
                   │ Scans       │    │ Attendance  │
                   └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Sign In/Out │    │ Update UI   │
                   │ Logic       │    │ & Show      │
                   │             │    │ Success     │
                   └─────────────┘    └─────────────┘
```

### Direct Sign In/Out:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Click Sign  │───▶│ Check Today │───▶│ Record      │
│ In/Out      │    │ Scans       │    │ Attendance  │
│ Button      │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🗄️ Database Schema

### Students Table:
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    department TEXT DEFAULT 'General Studies',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Attendance Table:
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT CHECK (type IN ('in', 'out')),
    qr_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Daily QR Codes Table:
```sql
CREATE TABLE daily_qr_codes (
    id SERIAL PRIMARY KEY,
    qr_token TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Key Features Summary

### Student Features:
- ✅ Simple App ID + Name login (no registration)
- ✅ QR code scanning for daily attendance
- ✅ Direct sign in/out buttons
- ✅ Personal attendance history
- ✅ Today's status display
- ✅ Mobile-responsive design

### Admin Features:
- ✅ Secure username/password authentication
- ✅ Daily QR code generation
- ✅ Complete attendance dashboard
- ✅ Advanced filtering and search
- ✅ CSV data export
- ✅ Student statistics and summaries
- ✅ Real-time attendance monitoring

## 🚀 Access Points

### Student Access:
- **Landing Page**: `http://localhost:3000`
- **Student Portal**: `http://localhost:3000/student`
- **Scanner**: `http://localhost:3000/scanner`
- **Records**: `http://localhost:3000/records`

### Admin Access:
- **Admin Login**: `http://localhost:3000/admin/login`
- **Daily QR**: `http://localhost:3000/admin/daily-qr`
- **Dashboard**: `http://localhost:3000/admin`

## 🔧 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **QR Scanning**: html5-qrcode library
- **Authentication**: Custom session management
- **Deployment**: Docker support included
