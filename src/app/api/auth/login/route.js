import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const users = await query(
      'SELECT id, name, email, role, unit, status FROM users WHERE name = ? AND password = ?',
      [username, password]
    );

    if (users && users.length > 0) {
      const user = users[0];
      if (user.status !== 'Aktif') {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
      }

      return NextResponse.json({ success: true, user });
    } else {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
