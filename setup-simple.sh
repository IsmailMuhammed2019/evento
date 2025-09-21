#!/bin/bash

echo "🚀 Setting up Simple Attendance System..."

# Check if we're in the right directory
if [ ! -d "simple-attendance-standalone" ]; then
    echo "❌ Error: simple-attendance-standalone directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Navigate to the standalone app
cd simple-attendance-standalone

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your Supabase credentials"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter after you've updated .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Supabase credentials are set
if grep -q "your_supabase_url_here" .env.local; then
    echo "⚠️  Warning: Please update your Supabase credentials in .env.local"
    echo "   The app won't work without proper Supabase configuration"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Create the attendance table in Supabase (see README.md)"
echo "3. Run: npm run dev"
echo ""
echo "🐳 For Docker deployment:"
echo "   docker-compose -f ../docker-compose.standalone.yml up --build -d"
echo ""
echo "📖 For more details, see: simple-attendance-standalone/README.md"
