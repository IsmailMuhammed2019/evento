import { NextRequest, NextResponse } from 'next/server';

// Simple admin credentials (in production, use proper authentication)
const ADMIN_CREDENTIALS = {
  'admin': 'admin123',
  'superadmin': 'super123',
  'manager': 'manager123'
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check credentials
    const validPassword = ADMIN_CREDENTIALS[username as keyof typeof ADMIN_CREDENTIALS];
    
    if (!validPassword || validPassword !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Return success with admin info
    return NextResponse.json({
      username: username,
      role: username === 'superadmin' ? 'superadmin' : 'admin',
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
