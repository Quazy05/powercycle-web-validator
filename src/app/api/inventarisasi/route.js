import { NextResponse } from 'next/server';
import { getDbConnection } from '../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    
    const pool = await getDbConnection();

    let query = 'SELECT * FROM neraca_sampah_tahunan';
    let params = [];

    if (tahun) {
      query += ' WHERE tahun = ?';
      params.push(tahun);
    }
    
    query += ' ORDER BY tahun DESC, category ASC';

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventarisasi data' }, { status: 500 });
  }
}
