import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const clients = await query('SELECT * FROM clients ORDER BY name ASC');
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients', details: error.message }, { status: 500 });
  }
}
