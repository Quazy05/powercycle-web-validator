import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function GET() {
  try {
    const pool = await getDbConnection();
    const [rows] = await pool.query('SELECT * FROM master_unit ORDER BY nama_unit ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch unit', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_unit } = body;
    if (!nama_unit) return NextResponse.json({ error: 'nama_unit is required' }, { status: 400 });

    const pool = await getDbConnection();
    const [result] = await pool.query('INSERT INTO master_unit (nama_unit) VALUES (?)', [nama_unit]);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert unit', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nama_unit } = body;
    if (!id || !nama_unit) return NextResponse.json({ error: 'id and nama_unit are required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query('UPDATE master_unit SET nama_unit = ? WHERE id = ?', [nama_unit, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update unit', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query('DELETE FROM master_unit WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete unit', details: error.message }, { status: 500 });
  }
}
