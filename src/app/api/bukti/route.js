import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const unit = searchParams.get('unit');

    let sql = 'SELECT * FROM bukti_bayar';
    const params = [];
    const conditions = [];

    if (month) {
      conditions.push('month = ?');
      params.push(month);
    }
    if (unit) {
      conditions.push('unit = ?');
      params.push(unit);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const buktiBayar = await query(sql, params);
    return NextResponse.json({ success: true, buktiBayar });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bukti bayar', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, month, unit, no_bukti, status, img_url } = data;

    const buktiId = id || 'B' + Date.now();
    const buktiStatus = status || 'Pending';

    await query(
      `INSERT INTO bukti_bayar (id, month, unit, no_bukti, status, img_url) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), img_url = VALUES(img_url)`,
      [buktiId, month, unit, no_bukti, buktiStatus, img_url || null]
    );

    // Insert log
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      'INSERT INTO activity_log (timestamp, user, action, detail, type) VALUES (?, ?, ?, ?, ?)',
      [timestamp, 'User', 'Upload Bukti Bayar', `Upload kwitansi ${no_bukti} untuk unit ${unit} - ${month}`, 'upload']
    );

    return NextResponse.json({ success: true, id: buktiId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save bukti bayar', details: error.message }, { status: 500 });
  }
}
