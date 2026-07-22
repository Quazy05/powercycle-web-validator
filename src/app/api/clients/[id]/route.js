import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = await getDbConnection();

    // Check if exists
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const current = rows[0];
    const updatedData = {
      name: body.name !== undefined ? body.name : current.name,
      address: body.address !== undefined ? body.address : current.address,
      contact: body.contact !== undefined ? body.contact : current.contact,
      joinDate: body.joinDate !== undefined ? body.joinDate : current.joinDate
    };

    await pool.query(
      'UPDATE clients SET name = ?, address = ?, contact = ?, joinDate = ? WHERE id = ?',
      [updatedData.name, updatedData.address, updatedData.contact, updatedData.joinDate, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const pool = await getDbConnection();
    
    await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client', details: error.message }, { status: 500 });
  }
}
