import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = await getDbConnection();

    // Check if exists
    const [rows] = await pool.query('SELECT * FROM neraca_sampah_tahunan WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Inventarisasi not found' }, { status: 404 });
    }

    const current = rows[0];
    const updatedData = {
      tahun: body.tahun !== undefined ? body.tahun : current.tahun,
      category: body.category !== undefined ? body.category : current.category,
      jenis: body.jenis !== undefined ? body.jenis : current.jenis,
      timbulan: body.timbulan !== undefined ? body.timbulan : current.timbulan,
      dimanfaatkan: body.dimanfaatkan !== undefined ? body.dimanfaatkan : current.dimanfaatkan,
      residu_tpa: body.residu_tpa !== undefined ? body.residu_tpa : current.residu_tpa
    };

    await pool.query(
      'UPDATE neraca_sampah_tahunan SET tahun = ?, category = ?, jenis = ?, timbulan = ?, dimanfaatkan = ?, residu_tpa = ? WHERE id = ?',
      [updatedData.tahun, updatedData.category, updatedData.jenis, updatedData.timbulan, updatedData.dimanfaatkan, updatedData.residu_tpa, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventarisasi', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const pool = await getDbConnection();
    
    await pool.query('DELETE FROM neraca_sampah_tahunan WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventarisasi', details: error.message }, { status: 500 });
  }
}
