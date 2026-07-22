import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function GET() {
  try {
    const pool = await getDbConnection();
    const [rows] = await pool.query('SELECT * FROM master_jenis_sampah ORDER BY kategori ASC, nama_jenis ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nama_jenis, kategori } = body;
    if (!nama_jenis || !kategori) return NextResponse.json({ error: 'nama_jenis and kategori are required' }, { status: 400 });

    const pool = await getDbConnection();
    const [result] = await pool.query(
      'INSERT INTO master_jenis_sampah (nama_jenis, kategori) VALUES (?, ?)',
      [nama_jenis, kategori]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to insert jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, nama_jenis, kategori } = body;
    if (!id || !nama_jenis || !kategori) return NextResponse.json({ error: 'id, nama_jenis, and kategori are required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query(
      'UPDATE master_jenis_sampah SET nama_jenis = ?, kategori = ? WHERE id = ?',
      [nama_jenis, kategori, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update jenis sampah', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.query('DELETE FROM master_jenis_sampah WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete jenis sampah', details: error.message }, { status: 500 });
  }
}
