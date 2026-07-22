import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, deskripsi, fields } = body;
    
    if (!nama || !fields) {
      return NextResponse.json({ error: 'Data program tidak lengkap' }, { status: 400 });
    }
    
    const db = await getDbConnection();
    await db.execute(
      'UPDATE programs SET nama = ?, deskripsi = ?, fields = ? WHERE id = ?',
      [nama, deskripsi || '', JSON.stringify(fields), id]
    );
    
    return NextResponse.json({ success: true, message: 'Program berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Gagal memperbarui program', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDbConnection();
    
    await db.execute('DELETE FROM programs WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'Program berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Gagal menghapus program', details: error.message }, { status: 500 });
  }
}
