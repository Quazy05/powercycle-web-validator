import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // 1. Cek apakah bukti ada
    const result = await query('SELECT * FROM bukti_bayar WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: 'Bukti tidak ditemukan' }, { status: 404 });
    }

    // 2. Hapus dari database
    await query('DELETE FROM bukti_bayar WHERE id = ?', [id]);

    // 3. Pastikan return JSON yang valid
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

    // Lakukan update ke database
    const result = await query(
      'UPDATE bukti_bayar SET status = ? WHERE id = ?',
      [status, id]
    );

    // Cek apakah ada baris yang berubah
    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}