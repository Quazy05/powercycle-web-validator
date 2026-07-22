import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const pool = await getDbConnection();
    
    // Check if deposit exists
    const [deposits] = await pool.query('SELECT * FROM deposits WHERE id = ?', [id]);
    if (!deposits || deposits.length === 0) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const deposit = deposits[0];

    // Delete deposit
    await pool.query('DELETE FROM deposits WHERE id = ?', [id]);

    if (deposit.status === 'Terverifikasi') {
      const month = deposit.date.substring(0, 7);
      await pool.query(
        `UPDATE neraca_sampah SET timbulan = timbulan - ?
         WHERE month = ? AND unit = ? AND category = ? AND jenis = ?`,
        [deposit.weight, month, deposit.unit || '', deposit.category, deposit.jenis]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete deposit', details: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = await getDbConnection();

    // Check if deposit exists
    const [deposits] = await pool.query('SELECT * FROM deposits WHERE id = ?', [id]);
    if (!deposits || deposits.length === 0) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const current = deposits[0];

    const updatedData = {
      date: body.date !== undefined ? body.date : current.date,
      time: body.time !== undefined ? body.time : current.time,
      category: body.category !== undefined ? body.category : current.category,
      jenis: body.jenis !== undefined ? body.jenis : current.jenis,
      pengelola: body.pengelola !== undefined ? body.pengelola : current.pengelola,
      weight: body.weight !== undefined ? body.weight : current.weight,
      status: body.status !== undefined ? body.status : current.status,
      remarks: body.remarks !== undefined ? body.remarks : current.remarks
    };

    // Update deposit
    await pool.query(
      'UPDATE deposits SET date = ?, time = ?, category = ?, jenis = ?, pengelola = ?, weight = ?, status = ?, remarks = ? WHERE id = ?',
      [updatedData.date, updatedData.time, updatedData.category, updatedData.jenis, updatedData.pengelola, updatedData.weight, updatedData.status, updatedData.remarks, id]
    );

    // Sync neraca_sampah
    if (current.status === 'Terverifikasi' && updatedData.status !== 'Terverifikasi') {
      const month = current.date.substring(0, 7);
      await pool.query(
        `UPDATE neraca_sampah SET timbulan = timbulan - ?
         WHERE month = ? AND unit = ? AND category = ? AND jenis = ?`,
        [current.weight, month, current.unit || '', current.category, current.jenis]
      );
    } else if (current.status !== 'Terverifikasi' && updatedData.status === 'Terverifikasi') {
      const month = updatedData.date.substring(0, 7);
      await pool.query(
        `INSERT INTO neraca_sampah (month, unit, category, jenis, timbulan, dimanfaatkan)
         VALUES (?, ?, ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE timbulan = timbulan + VALUES(timbulan)`,
        [month, current.unit || '', updatedData.category, updatedData.jenis, updatedData.weight]
      );
    } else if (current.status === 'Terverifikasi' && updatedData.status === 'Terverifikasi') {
      if (
        current.date.substring(0, 7) !== updatedData.date.substring(0, 7) ||
        current.category !== updatedData.category ||
        current.jenis !== updatedData.jenis ||
        current.weight !== updatedData.weight
      ) {
        const oldMonth = current.date.substring(0, 7);
        await pool.query(
          `UPDATE neraca_sampah SET timbulan = timbulan - ?
           WHERE month = ? AND unit = ? AND category = ? AND jenis = ?`,
          [current.weight, oldMonth, current.unit || '', current.category, current.jenis]
        );
        const newMonth = updatedData.date.substring(0, 7);
        await pool.query(
          `INSERT INTO neraca_sampah (month, unit, category, jenis, timbulan, dimanfaatkan)
           VALUES (?, ?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE timbulan = timbulan + VALUES(timbulan)`,
          [newMonth, current.unit || '', updatedData.category, updatedData.jenis, updatedData.weight]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deposit', details: error.message }, { status: 500 });
  }
}
