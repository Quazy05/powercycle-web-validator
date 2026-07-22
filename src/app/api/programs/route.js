import { NextResponse } from 'next/server';
import { getDbConnection } from '../../lib/db';

export async function GET() {
  try {
    const db = await getDbConnection();
    const [rows] = await db.execute('SELECT * FROM programs ORDER BY nama ASC');
    
    // Parse the fields JSON if needed (mysql2 might already parse it, but just to be safe)
    const programs = rows.map(row => ({
      ...row,
      fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : row.fields
    }));

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Gagal mengambil data program', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, fields } = body;
    
    if (!id || !nama || !fields) {
      return NextResponse.json({ error: 'Data program tidak lengkap' }, { status: 400 });
    }
    
    const db = await getDbConnection();
    await db.execute(
      'INSERT INTO programs (id, nama, deskripsi, fields) VALUES (?, ?, ?, ?)',
      [id, nama, deskripsi || '', JSON.stringify(fields)]
    );
    
    return NextResponse.json({ success: true, message: 'Program berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating program:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'ID Program sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat program', details: error.message }, { status: 500 });
  }
}
