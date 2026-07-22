import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = await getDbConnection();

    // Check if exists
    const [rows] = await pool.query('SELECT * FROM rekapitulasi_program WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Rekap program not found' }, { status: 404 });
    }

    const current = rows[0];
    const updatedData = {
      tahun: body.tahun !== undefined ? body.tahun : current.tahun,
      nama_program: body.nama_program !== undefined ? body.nama_program : current.nama_program,
      jenis_sampah: body.jenis_sampah !== undefined ? body.jenis_sampah : current.jenis_sampah,
      jenis_kegiatan: body.jenis_kegiatan !== undefined ? body.jenis_kegiatan : current.jenis_kegiatan,
      absolut_ton: body.absolut_ton !== undefined ? body.absolut_ton : current.absolut_ton
    };

    await pool.query(
      'UPDATE rekapitulasi_program SET tahun = ?, nama_program = ?, jenis_sampah = ?, jenis_kegiatan = ?, absolut_ton = ? WHERE id = ?',
      [updatedData.tahun, updatedData.nama_program, updatedData.jenis_sampah, updatedData.jenis_kegiatan, updatedData.absolut_ton, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rekap program', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const pool = await getDbConnection();
    
    await pool.query('DELETE FROM rekapitulasi_program WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rekap program', details: error.message }, { status: 500 });
  }
}
