import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const user = searchParams.get('user');

    let sql = 'SELECT * FROM deposits';
    const params = [];
    const conditions = [];

    if (unit) {
      conditions.push('unit = ?');
      params.push(unit);
    }
    if (user) {
      conditions.push('user = ?');
      params.push(user);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY date DESC, time DESC';

    const deposits = await query(sql, params);
    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deposits', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, date, time, user, client, unit, category, jenis, pengelola, weight, status, remarks } = data;

    const depositId = id || 'D' + Date.now();
    const depositStatus = status || 'Pending';

    await query(
      `INSERT INTO deposits (id, date, time, user, client, unit, category, jenis, pengelola, weight, status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [depositId, date, time, user || null, client || null, unit || null, category, jenis, pengelola, weight, depositStatus, remarks || '']
    );

    if (depositStatus === 'Terverifikasi') {
      const month = date.substring(0, 7);
      await query(
        `INSERT INTO neraca_sampah (month, unit, category, jenis, timbulan, dimanfaatkan)
         VALUES (?, ?, ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE timbulan = timbulan + VALUES(timbulan)`,
        [month, unit || '', category, jenis, weight]
      );
    }

    // Automatically insert activity log
    const timestamp = time.length === 5 ? `${date} ${time}:00` : `${date} ${time}`;
    const detailLog = `${category} (${jenis}) ${weight} kg - ${pengelola}`;
    await query(
      'INSERT INTO activity_log (timestamp, user, action, detail, type) VALUES (?, ?, ?, ?, ?)',
      [timestamp, user, 'Input Data Sampah', detailLog, 'input']
    );

    return NextResponse.json({ success: true, id: depositId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save deposit', details: error.message }, { status: 500 });
  }
}
