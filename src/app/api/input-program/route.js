import { NextResponse } from 'next/server';
import { getDbConnection } from '../../lib/db';

export async function GET() {
  try {
    const db = await getDbConnection();
    const [rows] = await db.query('SELECT * FROM input_program ORDER BY id DESC');
    
    const parsedRows = rows.map(row => ({
      ...row,
      form_data: typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data
    }));

    return NextResponse.json({ success: true, data: parsedRows });
  } catch (error) {
    console.error('Failed to fetch input programs:', error);
    return NextResponse.json({ error: 'Gagal mengambil data', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user, unit, program_name, date, time, form_data, kategori_sampah, jenis_sampah } = body;
    
    if (!user || !program_name || !date || !time || !form_data) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const pool = await getDbConnection();
    const formDataJson = JSON.stringify(form_data);
    
    const [result] = await pool.query(
      'INSERT INTO input_program (user, unit, program_name, date, time, form_data, kategori_sampah, jenis_sampah) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user, unit || 'Pusat', program_name, date, time, formDataJson, kategori_sampah || '', jenis_sampah || '']
    );
    
    // Sync ke neraca_sampah jika ada kategori dan jenis
    if (kategori_sampah && jenis_sampah) {
      // Cari nilai numerik pertama dalam form_data sebagai asumsi berat pemanfaatan
      let weight = 0;
      if (form_data && typeof form_data === 'object') {
        const numericValues = Object.values(form_data).map(v => Number(v)).filter(v => !isNaN(v) && v > 0);
        if (numericValues.length > 0) {
          weight = numericValues[0];
        }
      }

      if (weight > 0) {
        const month = date.substring(0, 7); // YYYY-MM
        const unitName = unit || 'Pusat';
        await pool.query(
          `INSERT INTO neraca_sampah (month, unit, category, jenis, timbulan, dimanfaatkan)
           VALUES (?, ?, ?, ?, 0, ?)
           ON DUPLICATE KEY UPDATE dimanfaatkan = dimanfaatkan + VALUES(dimanfaatkan)`,
          [month, unitName, kategori_sampah, jenis_sampah, weight]
        );
      }
    }
    
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Failed to insert input program:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data', details: error.message }, { status: 500 });
  }
}
