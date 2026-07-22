import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function GET() {
  try {
    const pool = await getDbConnection();
    const [rows] = await pool.query('SELECT * FROM master_pengelola ORDER BY nama_pengelola ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pengelola', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_pengelola } = body;
    if (!nama_pengelola) return NextResponse.json({ error: 'nama_pengelola is required' }, { status: 400 });

    const pool = await getDbConnection();
    const [result] = await pool.query('INSERT INTO master_pengelola (nama_pengelola) VALUES (?)', [nama_pengelola]);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert pengelola', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nama_pengelola } = body;
    if (!id || !nama_pengelola) return NextResponse.json({ error: 'id and nama_pengelola are required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query('UPDATE master_pengelola SET nama_pengelola = ? WHERE id = ?', [nama_pengelola, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pengelola', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query('DELETE FROM master_pengelola WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pengelola', details: error.message }, { status: 500 });
  }
}
