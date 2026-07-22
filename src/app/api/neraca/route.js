import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month');
    const unit = searchParams.get('unit');

    let sql = 'SELECT * FROM neraca_sampah WHERE 1=1';
    const params = [];

    if (month) {
      sql += ' AND month = ?';
      params.push(month);
    }

    if (unit) {
      sql += ' AND unit = ?';
      params.push(unit);
    }

    sql += ' ORDER BY month DESC';

    const neraca = await query(sql, params);

    return NextResponse.json({
      success: true,
      neraca
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch neraca data',
        details: error.message
      },
      { status: 500 }
    );
  }
}