import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = await getDbConnection();

    // Check if exists
    const [rows] = await pool.query('SELECT * FROM neraca_sampah WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Neraca not found' }, { status: 404 });
    }

    const current = rows[0];
    const updatedData = {
      month: body.month !== undefined ? body.month : current.month,
      category: body.category !== undefined ? body.category : current.category,
      jenis: body.jenis !== undefined ? body.jenis : current.jenis,
      timbulan: body.timbulan !== undefined ? body.timbulan : current.timbulan,
      dimanfaatkan: body.dimanfaatkan !== undefined ? body.dimanfaatkan : current.dimanfaatkan
    };

    await pool.query(
      'UPDATE neraca_sampah SET month = ?, category = ?, jenis = ?, timbulan = ?, dimanfaatkan = ? WHERE id = ?',
      [updatedData.month, updatedData.category, updatedData.jenis, updatedData.timbulan, updatedData.dimanfaatkan, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update neraca', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const pool = await getDbConnection();
    
    await pool.query('DELETE FROM neraca_sampah WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete neraca', details: error.message }, { status: 500 });
  }
}
