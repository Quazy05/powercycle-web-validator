import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user, unit, program_name, date, time, form_data, kategori_sampah, jenis_sampah } = body;
    
    if (!program_name || !date || !form_data) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    const db = await getDbConnection();
    
    // Ambil data lama untuk neraca sinkronisasi
    const [oldRows] = await db.query('SELECT * FROM input_program WHERE id = ?', [id]);
    let oldData = oldRows.length > 0 ? oldRows[0] : null;
    await db.execute(
      'UPDATE input_program SET user = ?, unit = ?, program_name = ?, date = ?, time = ?, form_data = ?, kategori_sampah = ?, jenis_sampah = ? WHERE id = ?',
      [user, unit || 'Pusat', program_name, date, time, JSON.stringify(form_data), kategori_sampah || '', jenis_sampah || '', id]
    );

    // Sync Neraca Sampah
    if (oldData && oldData.kategori_sampah && oldData.jenis_sampah) {
      let oldWeight = 0;
      let oldFormData = oldData.form_data;
      if (typeof oldFormData === 'string') {
        try { oldFormData = JSON.parse(oldFormData); } catch (e) { oldFormData = {}; }
      }
      if (oldFormData && typeof oldFormData === 'object') {
        const numericValues = Object.values(oldFormData).map(v => Number(v)).filter(v => !isNaN(v) && v > 0);
        if (numericValues.length > 0) oldWeight = numericValues[0];
      }
      if (oldWeight > 0) {
        const oldMonth = (oldData.date || '').substring(0, 7);
        await db.query(
          `UPDATE neraca_sampah SET dimanfaatkan = dimanfaatkan - ?
           WHERE month = ? AND unit = ? AND category = ? AND jenis = ?`,
          [oldWeight, oldMonth, oldData.unit || 'Pusat', oldData.kategori_sampah, oldData.jenis_sampah]
        );
      }
    }

    if (kategori_sampah && jenis_sampah) {
      let newWeight = 0;
      if (form_data && typeof form_data === 'object') {
        const numericValues = Object.values(form_data).map(v => Number(v)).filter(v => !isNaN(v) && v > 0);
        if (numericValues.length > 0) newWeight = numericValues[0];
      }
      if (newWeight > 0) {
        const newMonth = date.substring(0, 7);
        await db.query(
          `INSERT INTO neraca_sampah (month, unit, category, jenis, timbulan, dimanfaatkan)
           VALUES (?, ?, ?, ?, 0, ?)
           ON DUPLICATE KEY UPDATE dimanfaatkan = dimanfaatkan + VALUES(dimanfaatkan)`,
          [newMonth, unit || 'Pusat', kategori_sampah, jenis_sampah, newWeight]
        );
      }
    }
    
    return NextResponse.json({ success: true, message: 'Data pemanfaatan berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating input program:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDbConnection();
    
    // Ambil data lama untuk neraca sinkronisasi
    const [oldRows] = await db.query('SELECT * FROM input_program WHERE id = ?', [id]);
    let oldData = oldRows.length > 0 ? oldRows[0] : null;
    
    await db.execute('DELETE FROM input_program WHERE id = ?', [id]);

    // Sync Neraca Sampah
    if (oldData && oldData.kategori_sampah && oldData.jenis_sampah) {
      let oldWeight = 0;
      let oldFormData = oldData.form_data;
      if (typeof oldFormData === 'string') {
        try { oldFormData = JSON.parse(oldFormData); } catch (e) { oldFormData = {}; }
      }
      if (oldFormData && typeof oldFormData === 'object') {
        const numericValues = Object.values(oldFormData).map(v => Number(v)).filter(v => !isNaN(v) && v > 0);
        if (numericValues.length > 0) oldWeight = numericValues[0];
      }
      if (oldWeight > 0) {
        const oldMonth = (oldData.date || '').substring(0, 7);
        await db.query(
          `UPDATE neraca_sampah SET dimanfaatkan = dimanfaatkan - ?
           WHERE month = ? AND unit = ? AND category = ? AND jenis = ?`,
          [oldWeight, oldMonth, oldData.unit || 'Pusat', oldData.kategori_sampah, oldData.jenis_sampah]
        );
      }
    }
    
    return NextResponse.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting input program:', error);
    return NextResponse.json({ error: 'Gagal menghapus data', details: error.message }, { status: 500 });
  }
}
