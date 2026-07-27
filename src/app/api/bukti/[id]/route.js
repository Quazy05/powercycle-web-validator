import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    
    const result = await query('SELECT * FROM bukti_bayar WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: 'Bukti tidak ditemukan' }, { status: 404 });
    }

    
    await query('DELETE FROM bukti_bayar WHERE id = ?', [id]);

    
    return NextResponse.json({ success: true, message: 'Bukti berhasil dihapus' });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    
    const result = await query(
      'UPDATE bukti_bayar SET status = ? WHERE id = ?',
      [status, id]
    );

    
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}