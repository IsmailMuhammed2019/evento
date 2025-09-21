# 🐘 PostgreSQL Attendance System Setup

This version uses a local PostgreSQL database instead of Supabase, giving you complete control over your data.

## 🎯 **How It Works Now**

### **Student Flow:**
1. **Student Portal**: Students go to `/student` page
2. **Login**: Students enter their Student ID (e.g., "2021-0001")
3. **Dashboard**: Students see their attendance history and can sign in/out
4. **Self-Service**: Students can manage their own attendance

### **Admin Flow:**
1. **Scanner**: Admins use `/` page to scan QR codes (optional)
2. **Admin Dashboard**: Admins use `/admin` page to view all records
3. **Student Management**: Admins can see all students and their attendance

## 🚀 **Quick Setup with PostgreSQL**

### **Step 1: Start the PostgreSQL Version**

```bash
# Stop the current Supabase version
docker-compose -f docker-compose.standalone.yml down

# Start the PostgreSQL version
docker-compose -f docker-compose.postgres.yml up --build -d
```

### **Step 2: Wait for Database Initialization**

The system will automatically:
- Create PostgreSQL database
- Set up tables and indexes
- Insert sample students
- Create views and functions

### **Step 3: Access the Application**

Your app is now running at:
- **Student Portal**: http://localhost:3000/student
- **Admin Dashboard**: http://localhost:3000/admin
- **QR Scanner**: http://localhost:3000 (optional)
- **QR Generator**: http://localhost:3000/generate (optional)

## 👥 **Sample Students (Pre-loaded)**

The system comes with sample students you can test with:

| Student ID | Name | Department |
|------------|------|------------|
| APP-2025-97698 | Ismail Muhammed | Computer Science |
| APP-2025-12345 | Aisha Hassan | Mathematics |
| APP-2025-23456 | Omar Ali | Physics |
| APP-2025-34567 | Fatima Ibrahim | Chemistry |
| APP-2025-45678 | Ahmed Yusuf | Biology |
| APP-2025-56789 | Khadija Abdullah | Engineering |
| APP-2025-67890 | Hassan Mohammed | Medicine |
| APP-2025-78901 | Aminah Suleiman | Law |

## 📱 **How to Use**

### **For Students:**
1. Go to http://localhost:3000/student
2. Enter your Student ID (e.g., "APP-2025-97698")
3. Click "Sign In"
4. You'll see your dashboard with:
   - Quick sign in/out button
   - Today's status
   - Your attendance history

### **For Administrators:**
1. Go to http://localhost:3000/admin
2. View all student records
3. Filter by date, student, or type
4. Export data as CSV
5. Monitor attendance patterns

## 🗄️ **Database Structure**

### **Students Table:**
```sql
- id (auto-increment)
- student_id (unique identifier)
- first_name
- last_name
- email
- department
- is_active
- created_at
- updated_at
```

### **Attendance Table:**
```sql
- id (auto-increment)
- student_id (foreign key)
- date
- time
- type ('in' or 'out')
- created_at
```

## 🔧 **Database Management**

### **Connect to PostgreSQL:**
```bash
# Connect to the database
docker exec -it evento-postgres-1 psql -U attendance_user -d attendance_db

# List all students
SELECT * FROM students;

# List all attendance records
SELECT * FROM attendance_with_names;

# Add a new student
INSERT INTO students (student_id, first_name, last_name, department) 
VALUES ('APP-2025-99999', 'Alice', 'Johnson', 'Engineering');
```

### **Backup Database:**
```bash
# Create backup
docker exec evento-postgres-1 pg_dump -U attendance_user attendance_db > backup.sql

# Restore backup
docker exec -i evento-postgres-1 psql -U attendance_user attendance_db < backup.sql
```

## 🎨 **Features**

### **Student Portal:**
- ✅ Student ID login
- ✅ Personal attendance dashboard
- ✅ Sign in/out functionality
- ✅ Attendance history
- ✅ Today's status display

### **Admin Dashboard:**
- ✅ View all students
- ✅ View all attendance records
- ✅ Filter and search functionality
- ✅ Export to CSV
- ✅ Statistics and summaries

### **Database Features:**
- ✅ Local PostgreSQL database
- ✅ Automatic table creation
- ✅ Sample data included
- ✅ Optimized indexes
- ✅ Data integrity constraints

## 🔄 **Migration from Supabase**

If you were using the Supabase version:

1. **Export your data** from Supabase
2. **Stop the Supabase version**:
   ```bash
   docker-compose -f docker-compose.standalone.yml down
   ```
3. **Start the PostgreSQL version**:
   ```bash
   docker-compose -f docker-compose.postgres.yml up --build -d
   ```
4. **Import your data** into the new database

## 🛠️ **Management Commands**

```bash
# View logs
docker-compose -f docker-compose.postgres.yml logs -f

# Stop services
docker-compose -f docker-compose.postgres.yml down

# Restart services
docker-compose -f docker-compose.postgres.yml restart

# Rebuild and restart
docker-compose -f docker-compose.postgres.yml up --build -d

# Access database
docker exec -it evento-postgres-1 psql -U attendance_user -d attendance_db
```

## 🔍 **Troubleshooting**

### **Database Connection Issues:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs evento-postgres-1

# Test connection
docker exec evento-postgres-1 pg_isready -U attendance_user -d attendance_db
```

### **Application Issues:**
```bash
# Check application logs
docker logs evento-simple-attendance-1

# Restart application
docker-compose -f docker-compose.postgres.yml restart simple-attendance
```

## 🎉 **Benefits of PostgreSQL Version**

✅ **Complete Control**: Your data stays on your server  
✅ **No External Dependencies**: No need for Supabase account  
✅ **Better Performance**: Local database is faster  
✅ **Customizable**: Easy to modify database schema  
✅ **Backup Control**: Full control over backups  
✅ **Cost Effective**: No external service costs  

This PostgreSQL version gives you a complete, self-contained attendance system that you can run entirely on your own infrastructure!
